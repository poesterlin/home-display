import { jwtVerify, createRemoteJWKSet } from "jose"
import crypto from "crypto"
import { dev } from "$app/environment"
import type { JWTVerifyGetKey } from "jose"

const env = process.env;

function requireEnv(value: string | undefined, name: string): string {
    if (!value) throw new Error(`${name} is not set`)
    return value
}

type AuthConfig = {
    issuer: string
    clientId: string
    clientSecret: string
    baseUrl: string
}

function getConfig(): AuthConfig {
    return {
        issuer: requireEnv(env.TSIDP_ISSUER, "TSIDP_ISSUER"),
        clientId: requireEnv(env.TSIDP_CLIENT_ID, "TSIDP_CLIENT_ID"),
        clientSecret: requireEnv(env.TSIDP_CLIENT_SECRET, "TSIDP_CLIENT_SECRET"),
        baseUrl: requireEnv(env.URL, "URL")
    }
}

let cachedIssuer: string | null = null
let cachedJwks: JWTVerifyGetKey | null = null

function getJwks(issuer: string): JWTVerifyGetKey {
    if (cachedIssuer !== issuer || !cachedJwks) {
        cachedIssuer = issuer
        cachedJwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
    }

    return cachedJwks
}

export async function getTailscaleIdToken(code: string, requestOrigin?: string) {
    const { issuer, clientId, clientSecret, baseUrl } = getConfig()
    const host = requestOrigin ?? (dev ? "http://localhost:5173" : baseUrl)

    const response = await fetch(`${issuer}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams([
            ["grant_type", "authorization_code"],
            ["code", code],
            ["client_id", clientId],
            ["client_secret", clientSecret],
            ["redirect_uri", `${host}/auth/callback/tailscale`]
        ])
    })

    if (!response.ok) throw new Error("Token exchange failed")

    const { id_token } = await response.json()
    const verified = await jwtVerify(id_token, getJwks(issuer), {
        issuer,
        audience: clientId
    })
    return verified.payload
}

export function generateState(): string {
    return crypto.randomBytes(32).toString("hex")
}

export function getTailscaleAuthUrl(state: string, requestOrigin?: string): string {
    const { issuer, clientId, baseUrl } = getConfig()
    const host = requestOrigin ?? (dev ? "http://localhost:5173" : baseUrl)

    const params = new URLSearchParams([
        ["client_id", clientId],
        ["response_type", "code"],
        ["scope", "openid profile email"],
        ["redirect_uri", `${host}/auth/callback/tailscale`],
        ["state", state]
    ])
    return `${issuer}/authorize?${params}`
}
