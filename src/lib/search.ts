type SearchValue = string | number | boolean | null | undefined | SearchValue[];

export interface WeightedSearchField {
  value: SearchValue;
  weight?: number;
}

export function normaliseSearchText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function flattenSearchValue(value: SearchValue): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(flattenSearchValue);
  }

  const text = normaliseSearchText(value);
  return text ? [text] : [];
}

function getFields(fields: Array<SearchValue | WeightedSearchField>): WeightedSearchField[] {
  return fields.map((field) => {
    if (
      field &&
      typeof field === 'object' &&
      !Array.isArray(field) &&
      'value' in field
    ) {
      return field as WeightedSearchField;
    }

    return { value: field as SearchValue, weight: 1 };
  });
}

function scoreField(query: string, fieldValue: string) {
  if (!query || !fieldValue) return 0;
  if (fieldValue === query) return 100;
  if (fieldValue.startsWith(query)) return 80;
  if (fieldValue.split(' ').some((word) => word.startsWith(query))) return 65;
  if (fieldValue.includes(query)) return 45;
  return 0;
}

export function scoreSearchMatch(
  query: string,
  fields: Array<SearchValue | WeightedSearchField>,
) {
  const normalisedQuery = normaliseSearchText(query);
  if (!normalisedQuery) return 0;

  const terms = normalisedQuery.split(' ').filter(Boolean);
  const searchableFields = getFields(fields);

  return terms.reduce((total, term) => {
    const termScore = searchableFields.reduce((best, field) => {
      const weight = field.weight ?? 1;
      const values = flattenSearchValue(field.value);
      const fieldScore = values.reduce(
        (valueBest, value) => Math.max(valueBest, scoreField(term, value)),
        0,
      );
      return Math.max(best, fieldScore * weight);
    }, 0);

    return total + termScore;
  }, 0);
}

export function matchesSearch(
  query: string,
  fields: Array<SearchValue | WeightedSearchField>,
) {
  const normalisedQuery = normaliseSearchText(query);
  if (!normalisedQuery) return true;

  const terms = normalisedQuery.split(' ').filter(Boolean);
  const searchableFields = getFields(fields).flatMap((field) => flattenSearchValue(field.value));

  return terms.every((term) =>
    searchableFields.some((field) => scoreField(term, field) > 0),
  );
}
