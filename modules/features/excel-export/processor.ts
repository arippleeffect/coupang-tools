/**
 * Excel Export Processor
 *
 * Processes vendor return items (FC code merging)
 */

// FC codes that should be merged into representative codes
const fcCodesToMerge = new Set([
  'SFSCH1',
  'INC20',
  'SFAYG10',
  'SFNYJ2',
  'SFCHJ1',
  'SFNHN1',
  'SFISN5',
  'SFGWJ1',
  'SFWBS2',
  'SFGMP1',
  'SFISN1',
  'SFBSN5',
  'SFDJN2',
  'SFNYJ3',
  'SFYAT1',
  'SFJEJ1',
  'SFNGH2',
  'SFWDG1',
  'SFBUC3',
  'SFCHA1',
  'SFGNP1',
  'SFDJN3',
]);

/**
 * Check if FC code is a representative code
 */
function isRepresentativeFcCode(code: string): boolean {
  return code.startsWith('XRC') || code.startsWith('CHA9');
}

/**
 * Process items and merge FC codes
 */
export function processItems(items: any[]): any[] {
  return items.map((item) => {
    // Skip if no FC codes need merging
    if (!Object.keys(item.returnableQtyByFCTotal).some((g) => fcCodesToMerge.has(g))) {
      return item;
    }

    // Find or create primary FC code
    let primaryFcCode: string | null = null;
    for (const fcCode in item.returnableQtyByFCTotal) {
      if (isRepresentativeFcCode(fcCode)) {
        primaryFcCode = fcCode;
        break;
      }
    }

    if (!primaryFcCode) {
      primaryFcCode = 'CHA9';
      item.returnableQtyByFCTotal[primaryFcCode] = {
        qty: 0,
        fcName: 'CHA9',
      };
    }

    // Merge quantities
    Object.keys(item.returnableQtyByFCTotal)
      .filter((g) => fcCodesToMerge.has(g))
      .forEach((g) => {
        const W = item.returnableQtyByFCTotal[g];
        item.returnableQtyByFCTotal[primaryFcCode!].qty += W?.qty ?? 0;
      });

    // Remove merged FC codes
    Object.keys(item.returnableQtyByFCTotal)
      .filter((g) => fcCodesToMerge.has(g))
      .forEach((g) => {
        delete item.returnableQtyByFCTotal[g];
      });

    return item;
  });
}
