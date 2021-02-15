type TrendMethods =
  | 'avg'
  | 'min'
  | 'max'
  | 'mean'
  | 'median'
  | 'std'
  | 'p(75)'
  | 'p(90)'
  | 'p(95)'
  | 'p(99)'
  | 'p(99.9)'
  | 'p(99.99)';

type CountMethods = 'count' | 'rps';

type RateMethods = 'rate';

type GaugeMethods = 'value';

export type AggregationMethods = Array<TrendMethods | CountMethods | RateMethods | GaugeMethods>;

export interface AggregationType<T> {
  methods: T[];
  default: T;
}

type AggregationTypeMap = {
  trend: AggregationType<TrendMethods>;
  counter: AggregationType<CountMethods>;
  rate: AggregationType<RateMethods>;
  gauge: AggregationType<GaugeMethods>;
};

export const AGGREGATION_TYPES: AggregationTypeMap = {
  trend: {
    methods: ['avg', 'min', 'max', 'mean', 'median', 'std', 'p(75)', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)', 'p(99.99)'],
    default: 'avg',
  },
  counter: {
    methods: ['count', 'rps'],
    default: 'count',
  },
  rate: {
    methods: ['rate'],
    default: 'rate',
  },
  gauge: {
    methods: ['value'],
    default: 'value',
  },
};
