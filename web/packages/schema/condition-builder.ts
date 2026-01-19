import type { 
  Condition, 
  EntityCondition, 
  CompoundCondition,
  ComparisonOperator,
  LogicalOperator
} from "./dist/types";

/**
 * Fluent builder for creating conditions
 */
export class ConditionBuilder {
  
  // Entity condition shortcuts
  static entity(entityId: string) {
    return new EntityConditionBuilder(entityId);
  }

  static state(variable: string) {
    return new StateConditionBuilder(variable);
  }

  static time() {
    return new TimeConditionBuilder();
  }

  static and(...conditions: Condition[]): CompoundCondition {
    return { type: "compound", operator: "and", conditions };
  }

  static or(...conditions: Condition[]): CompoundCondition {
    return { type: "compound", operator: "or", conditions };
  }

  static not(condition: Condition): Condition {
    return { type: "not", condition };
  }
}

class EntityConditionBuilder {
  private entityId: string;
  private attribute?: string;

  constructor(entityId: string) {
    this.entityId = entityId;
  }

  attr(attribute: string): this {
    this.attribute = attribute;
    return this;
  }

  private build(operator: ComparisonOperator, value: string | number | boolean): EntityCondition {
    return {
      type: "entity",
      entityId: this.entityId,
      attribute: this.attribute ?? null,
      operator,
      value,
    };
  }

  equals(value: string | number | boolean) { return this.build("eq", value); }
  notEquals(value: string | number | boolean) { return this.build("neq", value); }
  greaterThan(value: number) { return this.build("gt", value); }
  greaterOrEqual(value: number) { return this.build("gte", value); }
  lessThan(value: number) { return this.build("lt", value); }
  lessOrEqual(value: number) { return this.build("lte", value); }
  contains(value: string) { return this.build("contains", value); }
  matches(pattern: string) { return this.build("matches", pattern); }
  
  // Convenience for boolean entities
  isOn() { return this.build("eq", "on"); }
  isOff() { return this.build("eq", "off"); }
  isHome() { return this.build("eq", "home"); }
  isAway() { return this.build("neq", "home"); }
}

class StateConditionBuilder {
  private variable: string;

  constructor(variable: string) {
    this.variable = variable;
  }

  private build(operator: ComparisonOperator, value: string | number | boolean) {
    return {
      type: "state" as const,
      variable: this.variable,
      operator,
      value,
    };
  }

  equals(value: string | number | boolean) { return this.build("eq", value); }
  notEquals(value: string | number | boolean) { return this.build("neq", value); }
  greaterThan(value: number) { return this.build("gt", value); }
  lessThan(value: number) { return this.build("lt", value); }
}

class TimeConditionBuilder {
  private _after?: string;
  private _before?: string;

  after(time: string): this {
    this._after = time;
    return this;
  }

  before(time: string): this {
    this._before = time;
    return this;
  }

  build(): Condition {
    return {
      type: "time" as const,
      after: this._after,
      before: this._before,
    };
  }
}
