/**
 * 金额格式化工具函数
 *
 * 📌 核心概念：所有金额在内部存储时用"分"作为单位（整数，没有小数），
 * 只在显示给用户看的时候才除以 100 变成"元"。
 * 为什么要这样做？因为计算机做小数运算会出错（0.1 + 0.2 ≠ 0.3），
 * 用整数（分）来算就不会有这个问题。
 *
 * 例如：12.50 元在代码里存的是 1250（就是 1250 分 = 12.50 元）
 */

/**
 * 把内部存储的"分"转换为给用户看的金额字符串（带 ¥ 符号）
 * 例如：1250 分 → "¥12.50"（带千分位逗号，比如 ¥1,234.56）
 */
export function formatFen(amountInFen: number): string {
  const yuan = amountInFen / 100
  return `¥${yuan.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * 把"分"转换为纯数字字符串（不带 ¥ 符号）。
 * 与 formatFen 的区别：formatFen 返回 "¥12.50"（给用户展示用），
 * 本函数返回 "12.50"（给程序内部计算或显示用）。
 * 例如：1250 分 → "12.50"
 */
export function fenToYuan(amountInFen: number): string {
  return (amountInFen / 100).toFixed(2)
}

/**
 * 把用户输入的金额文字转成"分"（存储单位）。
 * 能容错处理各种输入格式："12.5"、"12.50"、"12.5元"、"¥12.5"、"1,234.56"
 * 如果输入的内容无法识别为金额（如空字符串、字母、负数），返回 null 表示无效。
 * 例如："12.50" → 1250 分，"12.5元" → 1250 分，"" → null
 */
export function parseAmountToFen(input: string): number | null {
  // 去掉常见的非数字字符（¥ 符号、"元"字、空格、千分位逗号），只保留数字和小数点
  const cleaned = input.replace(/[¥元\s,]/g, '').trim()
  const num = parseFloat(cleaned)
  if (isNaN(num) || num < 0) return null
  // Round to nearest 分 and convert
  return Math.round(num * 100)
}

/**
 * 把"分"转换为不带 ¥ 符号的纯数字字符串，专门用于金额输入框的初始值。
 * 与 formatFen 的区别：formatFen 返回 "¥12.50"（给用户看的），
 * 本函数返回 "12.50"（输入框里编辑用的，这样用户改数字更方便）。
 * 例如：1250 分 → "12.50"
 */
export function fenToInputValue(amountInFen: number): string {
  return (amountInFen / 100).toFixed(2)
}
