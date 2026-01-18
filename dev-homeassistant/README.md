# Home Assistant Development Environment

This directory contains everything you need to test your custom `esphome_display` HACS component locally with a development version of Home Assistant.

## Features

### 🚀 **Auto-Component Mounting**
Your `custom_components/esphome_display` directory is automatically mounted into the container at `/config/custom_components`. This means:

- **Live Reload**: Changes to your component code are immediately available
- **No Copying**: Direct development from your project directory
- **Full Integration**: Component behaves exactly like in production

### 🐛 **Debug Mode Enabled**
- Debug logging enabled by default
- Frontend development mode for UI components
- Access to developer tools

### 🛠️ **Development Tools**
- **Component Validation**: Run `./scripts/dev.sh check` to validate your component
- **Shell Access**: Debug inside the container with `./scripts/dev.sh shell`
- **Log Monitoring**: Real-time logs with `./scripts/dev.sh logs`

## Usage Examples

### Testing Component Changes
1. Make changes to your component in `custom_components/esphome_display/`
2. Restart Home Assistant: `./scripts/dev.sh restart`
3. Test your changes at http://localhost:8123

### Validating Component
```bash
./scripts/dev.sh check
```

### Debugging Issues
```bash
# Monitor logs
./scripts/dev.sh logs

# Open shell for debugging
./scripts/dev.sh shell

# Inside container:
python -m script.hassfest --config-path /config --domain esphome_display
```

## Configuration

The `config/configuration.yaml` includes:
- `default_config` for full Home Assistant experience
- Debug logging enabled
- Frontend development mode
- Your custom component auto-discovery

## VS Code Integration (Optional)

The docker-compose includes a VS Code server:
1. Start the VS Code container: `docker-compose up -d vscode`
2. Access at http://localhost:8443
3. Password: `dev123`

## Troubleshooting

### Port Already in Use
If port 8123 is already in use:
```bash
# Stop other HA instances
sudo lsof -i :8123
# Or modify docker-compose.yml to use different ports
```

### Component Not Found
1. Ensure `custom_components/esphome_display/` exists in your project root
2. Check container logs: `./scripts/dev.sh logs`
3. Restart container: `./scripts/dev.sh restart`

### Permission Issues
```bash
# Fix permissions
sudo chown -R $USER:$USER dev-homeassistant/
chmod +x dev-homeassistant/scripts/dev.sh
```

## Development Workflow

1. **Initial Setup**: `./scripts/dev.sh setup`
2. **Start Development**: `./scripts/dev.sh start`
3. **Make Changes**: Edit component files
4. **Test Changes**: Restart or watch for reload

## Next Steps

Once your component is working locally:
1. Test with different Home Assistant versions
2. Validate with hassfest and hacsfest
3. Update version in `manifest.json`
4. Submit to HACS

## Notes

- Uses Home Assistant `dev` image (latest development version)
- Data persists in Docker volumes
- Automatic restart on system reboot
- All ports exposed for integration testing