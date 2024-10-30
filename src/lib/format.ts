import BigNumber from "bignumber.js";

const shorten = (value: string, start: number, end: number) => {
  return value.length > start + end
    ? `${value.slice(0, start)}...${value.slice(-end)}`
    : value;
};

export const replace0x = (value: string) => value.replace("0x", "0×");

export const formatAddress = (value: string, length = 4) => {
  if (length === 0) return replace0x(value);

  return shorten(
    replace0x(value),
    length + (value.startsWith("0x") ? 2 : 0),
    length,
  );
};

export const formatInteger = (value: number, useGrouping?: boolean) =>
  Intl.NumberFormat(undefined, { useGrouping }).format(value);

export const formatNumber = (
  value: BigNumber,
  options?: {
    prefix?: string;
    dp?: number;
    minDp?: number;
    roundingMode?: BigNumber.RoundingMode;
    exact?: boolean;
    useGrouping?: boolean;
    trimTrailingZeros?: boolean;
    roundLtMinToZero?: boolean;
  },
) => {
  const prefix = options?.prefix ?? "";
  const dp = options?.dp ?? 2;
  let minDp = options?.minDp ?? 0;
  const roundingMode = options?.roundingMode ?? BigNumber.ROUND_HALF_UP;
  const exact = options?.exact ?? false;

  // 0 < value < minValue
  const minValue = new BigNumber(10).pow(-dp);
  if (value.gt(0) && value.lt(minValue)) {
    if (!options?.roundLtMinToZero) return `<${prefix}${minValue.toFixed(dp)}`;
    return `${prefix}${new BigNumber(0).toFixed(dp)}`;
  }

  if (!exact) {
    let _value = value;
    let suffix = "";
    if (_value.lt(1000 * 10)) {
    } else if (_value.lt(1000 ** 2)) {
      _value = _value.div(1000 ** 1);
      suffix = "K";
      minDp = 0;
    } else if (_value.lt(1000 ** 3)) {
      _value = _value.div(1000 ** 2);
      suffix = "M";
      minDp = 0;
    } else if (_value.lt(1000 ** 4)) {
      _value = _value.div(1000 ** 3);
      suffix = "B";
      minDp = 0;
    } else {
      _value = _value.div(1000 ** 4);
      suffix = "T";
      minDp = 0;
    }

    const maxDigits = 3;
    const digitsCount = _value
      .integerValue(BigNumber.ROUND_DOWN)
      .toString().length; // 1 <= _value < 1000, so digitsCount is in {1,2,3}
    const newDp = Math.max(minDp, Math.min(dp, maxDigits - digitsCount));

    let [integers, decimals] = _value.toFixed(newDp, roundingMode).split(".");
    if (integers.length > digitsCount) {
      // Rounded up from 999.9xx to 1000
      [integers, decimals] = _value
        .toFixed(newDp, BigNumber.ROUND_DOWN)
        .split(".");
    }

    const integersFormatted = formatInteger(
      parseInt(integers),
      options?.useGrouping,
    );
    const decimalsFormatted = decimals !== undefined ? `.${decimals}` : "";
    return `${prefix}${integersFormatted}${decimalsFormatted}${suffix}`;
  } else {
    const [integers, decimals] = value.toFixed(dp, roundingMode).split(".");
    const integersFormatted = formatInteger(
      integers !== "" ? parseInt(integers) : 0,
      options?.useGrouping,
    );

    let decimalsFormatted: string | undefined = decimals;
    if (options?.trimTrailingZeros && decimalsFormatted !== undefined) {
      while (decimalsFormatted[decimalsFormatted.length - 1] === "0")
        decimalsFormatted = decimalsFormatted.slice(0, -1);
      if (decimalsFormatted.length === 0) decimalsFormatted = undefined;
    }
    decimalsFormatted =
      decimalsFormatted !== undefined ? `.${decimalsFormatted}` : "";

    return `${prefix}${integersFormatted}${decimalsFormatted}`;
  }
};

export const formatUsd = (
  value: BigNumber,
  options?: { dp?: number; exact?: boolean },
) => {
  const dp = options?.dp ?? 2;
  const minDp = dp;
  const exact = options?.exact ?? false;

  return formatNumber(value, {
    prefix: "$",
    dp,
    minDp,
    roundingMode: BigNumber.ROUND_HALF_UP,
    exact,
  });
};

export const formatPoints = (value: BigNumber, options?: { dp?: number }) => {
  const dp = options?.dp ?? 0;

  return formatNumber(value, {
    dp,
    roundingMode: BigNumber.ROUND_HALF_UP,
    exact: true,
    useGrouping: true,
    trimTrailingZeros: true,
  });
};

export const formatPercent = (
  value: BigNumber,
  options?: { dp?: number; useAccountingSign?: boolean },
) => {
  const dp = options?.dp ?? 2;
  const useAccountingSign = options?.useAccountingSign ?? false;

  const formattedValue = Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(+value.div(100));

  return !useAccountingSign || value.gte(0)
    ? formattedValue
    : `(${formattedValue[0] === "-" ? formattedValue.slice(1) : formattedValue})`;
};

export const formatToken = (
  value: BigNumber,
  options?: {
    dp?: number;
    exact?: boolean;
    useGrouping?: boolean;
    trimTrailingZeros?: boolean;
    roundLtMinToZero?: boolean;
  },
) => {
  const dp = options?.dp ?? 2;
  const exact = options?.exact ?? true;
  const useGrouping = options?.useGrouping ?? true;
  const trimTrailingZeros = options?.trimTrailingZeros ?? true;
  const roundLtMinToZero = options?.roundLtMinToZero ?? false;

  return formatNumber(value, {
    dp,
    roundingMode: BigNumber.ROUND_DOWN,
    exact,
    useGrouping,
    trimTrailingZeros,
    roundLtMinToZero,
  });
};
