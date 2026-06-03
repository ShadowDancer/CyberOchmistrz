import { CrewMember } from "./crew";
import { Recipie, MealType } from "./recipe";
import { AdditionalSupplyCategoryGroup, AdditionalSupplyItem } from "./supply";
import { getSupplyById } from './supplyData';
import { produce, castDraft } from 'immer';

export class Cruise {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly dateCreated: string,
    public readonly dateModified: string,
    public readonly crewMembers: readonly CrewMember[],
    public readonly days: readonly CruiseDay[],
    public readonly additionalSupplies: readonly CruiseSupply[],
    public readonly startDate?: string, // YYYY-MM-DD format
  ) {}

  // cruise details

  public static createNew(
    name: string,
    length: number,
    crewMembers: CrewMember[],
    predefinedDays?: CruiseDay[],
    predefinedAdditionalSupplies?: CruiseSupply[],
    startDate?: string,
  ): Cruise {
    if (predefinedDays && length != predefinedDays.length) {
      throw new Error("when inserting days directly, length must match exactly")
    }

    const now = new Date().toISOString();

    const days = predefinedDays ?? Array.from({ length }, (_, i) => ({
      dayNumber: i + 1,
      recipes: [],
    }));

    return new Cruise(
      now,
      name,
      now,
      now,
      crewMembers,
      days,
      predefinedAdditionalSupplies ?? [],
      startDate,
    );
  }

  public static fromCruise(data: Cruise): Cruise {
    return new Cruise(
      data.id,
      data.name,
      data.dateCreated,
      data.dateModified,
      data.crewMembers,
      data.days,
      data.additionalSupplies,
      data.startDate,
    );
  }

  private with(modifiedValues: Partial<Omit<Cruise, 'id' | 'dateCreated'>>): Cruise {
    const name = modifiedValues.name ?? this.name;
    const crewMembers = modifiedValues.crewMembers ?? this.crewMembers;
    const days = modifiedValues.days ?? this.days;
    const additionalSupplies = modifiedValues.additionalSupplies ?? this.additionalSupplies;
    const startDate = modifiedValues.startDate ?? this.startDate;

    // No-op: nothing changed, so keep the same instance. immer returns the same
    // array reference when a producer mutates nothing, so this catches no-op
    // updates (e.g. out-of-bounds reorder). Avoids a needless dateModified bump,
    // lets React skip re-render and saveCruise skip a redundant write.
    if (
      name === this.name &&
      crewMembers === this.crewMembers &&
      days === this.days &&
      additionalSupplies === this.additionalSupplies &&
      startDate === this.startDate
    ) {
      return this;
    }

    const now = new Date().toISOString()

    return new Cruise(
      this.id,
      name,
      this.dateCreated,
      now,
      crewMembers,
      days,
      additionalSupplies,
      startDate,
    )
  }

  public updateCruiseDetails(
    name: string,
    length: number,
    crewMembers: CrewMember[],
    startDate?: string,
  ): Cruise {
    const newDays = length === this.days.length
      ? this.days // unchanged length: reuse ref so an otherwise no-op edit can return `this`
      : length > this.days.length
        ? this.days.concat(Array.from({ length: length - this.days.length }, (_, i) => ({ dayNumber: i + this.days.length + 1, recipes: [] })))
        : this.days.filter((day) => day.dayNumber <= length);

    return this.with({
      name: name,
      crewMembers: crewMembers,
      startDate: startDate,
      days: newDays
    });
  }

  // receipes

  public insertRecipe(dayNumber: number, recipe: CruiseDayRecipe): Cruise {
    return this.with({
      days: produce(this.days, days => {
        const day = days[dayNumber - 1];

        if (!day) {
          return;
        }

        day.recipes.push(castDraft(recipe));
      })
    })
  }

  public updateCruiseDayRecipe(dayNumber: number, recipeIndex: number, updates: Partial<Omit<CruiseDayRecipe, 'originalRecipeId'>>) : Cruise {
    return this.with({
      days: produce(this.days, days => {
        const day = days[dayNumber - 1];
        const recipe = day?.recipes[recipeIndex];

        if (!recipe.recipeData) {
          return;
        }

        day.recipes[recipeIndex] = castDraft({ ...recipe, ...updates });
      })
    });
  }

  public updateRecipe(
    dayNumber: number,
    recipeIndex: number,
    updates: Partial<Recipie>,
  ): Cruise {
    return this.with({
      days: produce(this.days, days => {
        const day = days[dayNumber - 1];
        const recipe = day?.recipes[recipeIndex];

        if (!recipe?.recipeData) {
          return;
        }

        recipe.recipeData = castDraft({ ...recipe.recipeData, ...updates });
      })
    });
  }

  public removeRecipe(
    dayNumber: number,
    recipeId: string,
    recipeIndex: number,
  ): Cruise {
    return this.with({
      days: produce(this.days, days => {
        const day = days[dayNumber - 1];

        if (!day) {
          return;
        }

        const recipies = day.recipes;

        if (recipies[recipeIndex]?.originalRecipeId !== recipeId) {
          return;
        }

        recipies.splice(recipeIndex, 1);
      })
    });
  }

  public reorderRecipes(
    dayNumber: number,
    fromIndex: number,
    toIndex: number,
  ): Cruise  {
    return this.with({
      days: produce(this.days, days => {
        const recipes = days[dayNumber - 1]?.recipes;

        if (
          !recipes ||
          fromIndex < 0 ||
          fromIndex >= recipes.length ||
          toIndex < 0 ||
          toIndex >= recipes.length
        ) {
          return;
        }

        const [moved] = recipes.splice(fromIndex, 1);
        recipes.splice(toIndex, 0, moved);
      })
    });
  }

  public willLengthReductionRemoveRecipes(newLength: number): boolean {
    if (newLength >= this.days.length) return false;

    return this.days.slice(newLength - 1).some((day) => day.recipes.length > 0);
  }

  public moveRecipeBetweenDays(
    fromDayNumber: number,
    toDayNumber: number,
    fromIndex: number,
    toIndex?: number,
  ): Cruise {
    return this.with({
      days: produce(this.days, days => {
        if (
          fromDayNumber < 1 ||
          fromDayNumber > days.length ||
          toDayNumber < 1 ||
          toDayNumber > days.length
        ) {
          return;
        }

        const fromRecipes = days[fromDayNumber - 1].recipes;
        if (fromIndex < 0 || fromIndex >= fromRecipes.length) {
          return;
        }

        const toRecipes = days[toDayNumber - 1].recipes;

        const [movedRecipe] = fromRecipes.splice(fromIndex, 1);

        // Add recipe to target day at specified index or at the end
        const insertIndex =
          toIndex !== undefined && toIndex >= 0 && toIndex <= toRecipes.length
            ? toIndex
            : toRecipes.length;
        toRecipes.splice(insertIndex, 0, movedRecipe);
      })
    })
  }

  // additional supplies

  public upsertAdditionalSupply(supply: CruiseSupply): Cruise {
    return this.with({
      additionalSupplies: produce(this.additionalSupplies, additionalSupplies => {
        const existingSupplyIndex = additionalSupplies.findIndex((s) => idsEqual(s, supply));
        if (existingSupplyIndex >= 0) {
          additionalSupplies[existingSupplyIndex].amount = supply.amount;
        } else {
          additionalSupplies.push(supply);
        }
      })
    });
  }

  public addAdditionalSupply(supply: CruiseSupply): Cruise {
    return this.with({
      additionalSupplies: produce(this.additionalSupplies, additionalSupplies => {
        const existingSupplyIndex = additionalSupplies.findIndex((s) => idsEqual(s, supply));
        if (existingSupplyIndex >= 0) {
          additionalSupplies[existingSupplyIndex].amount += supply.amount;
        } else {
          additionalSupplies.push(supply);
        }
      })
    });
  }

  public removeAdditionalSupply(
    supplyId: string,
    isPerPerson: boolean,
    isPerDay: boolean,
  ): Cruise {
    return this.with({
      additionalSupplies: produce(this.additionalSupplies, additionalSupplies => {
        const existingSupplyIndex = additionalSupplies.findIndex((s) => idsEqual(s, { id: supplyId, isPerDay, isPerPerson }));
        if (existingSupplyIndex >= 0) {
          additionalSupplies.splice(existingSupplyIndex, 1);
        }
      })
    });
  }

  public hasAdditionalSupply(
    supplyId: string,
    isPerPerson: boolean,
    isPerDay: boolean,
  ): boolean {
    return this.additionalSupplies.some((s) => idsEqual(s, { id: supplyId, isPerDay, isPerPerson }));
  }

  public getAdditionalSupplyAmount(
    supplyId: string,
    isPerPerson: boolean,
    isPerDay: boolean,
  ): number | null {
    const item = this.additionalSupplies.find((s) => idsEqual(s, { id: supplyId, isPerDay, isPerPerson }));

    return item ? item.amount : null;
  }

  public groupAdditionalSuppliesByCategory(): AdditionalSupplyCategoryGroup[] {
    const grouped: { [key: string]: AdditionalSupplyItem[] } = {};

    this.additionalSupplies.forEach((item) => {
      const supplyDetails = getSupplyById(item.id);
      if (supplyDetails) {
        const category =
          supplyDetails.category ||
          (supplyDetails.isIngredient ? "inne" : "Pozostałe produkty");

        if (!grouped[category]) {
          grouped[category] = [];
        }

        grouped[category].push({
          supply: supplyDetails,
          amount: item.amount,
          isPerPerson: item.isPerPerson,
          isPerDay: item.isPerDay,
        });
      }
    });

    // Convert to array and sort by category name for consistent display order
    return Object.keys(grouped)
      .sort()
      .map((category) => ({
        category,
        supplies: grouped[category].sort((a, b) => {
          // First sort by supply name
          const nameComparison = a.supply.name.localeCompare(b.supply.name, "pl");
          if (nameComparison !== 0) {
            return nameComparison;
          }

          // If names are equal, sort by flag combination priority: fixed -> per person -> per day -> per person per day
          const getPriority = (item: AdditionalSupplyItem) => {
            if (!item.isPerPerson && !item.isPerDay) return 0; // fixed
            if (item.isPerPerson && !item.isPerDay) return 1; // per person
            if (!item.isPerPerson && item.isPerDay) return 2; // per day
            return 3; // per person per day
          };

          return getPriority(a) - getPriority(b);
        }),
      }));
  }
}

export interface CruiseDay {
  readonly dayNumber: number;
  readonly recipes: readonly CruiseDayRecipe[];
}

export interface CruiseSupply {
  readonly id: string;
  readonly amount: number;
  readonly isPerPerson: boolean;
  readonly isPerDay: boolean;
}

type CruiseSupplyKey = Pick<CruiseSupply, "id" | "isPerDay" | "isPerPerson">;

function idsEqual(a: CruiseSupplyKey, b: CruiseSupplyKey): boolean {
  return a.id === b.id && a.isPerDay === b.isPerDay && a.isPerPerson === b.isPerPerson;
}

export interface CruiseDayRecipe {
  readonly originalRecipeId: string;
  readonly recipeData: Recipie; // required: snapshot taken at add-time
  readonly crewCount: number;
  readonly mealSlot: MealType;
}
