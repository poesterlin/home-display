import { validateProject } from "$lib/codegen/validations";
import type { ValidationError } from "$lib/codegen/validations";
import { projectStore } from "./project.svelte";

function createValidationStore() {
  const errors = $derived(
    projectStore.project ? validateProject(projectStore.project) : [],
  );

  return {
    get errors() {
      return errors;
    },

    getErrorsForComponent(componentId: string): ValidationError[] {
      return errors.filter((e) => e.componentId === componentId);
    },

    hasErrors(componentId: string): boolean {
      return errors.some((e) => e.componentId === componentId);
    },
  };
}

export const validationStore = createValidationStore();
