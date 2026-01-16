const fcCodesToMerge = new Set([
  "SFSCH1",
  "INC20",
  "SFAYG10",
  "SFNYJ2",
  "SFCHJ1",
  "SFNHN1",
  "SFISN5",
  "SFGWJ1",
  "SFWBS2",
  "SFGMP1",
  "SFISN1",
  "SFBSN5",
  "SFDJN2",
  "SFNYJ3",
  "SFYAT1",
  "SFJEJ1",
  "SFNGH2",
  "SFWDG1",
  "SFBUC3",
  "SFCHA1",
  "SFGNP1",
  "SFDJN3",
]);

/**
 * 대표 FC 코드 여부 확인
 * @param code - FC 코드
 * @returns 대표 FC 코드 여부
 */
function isRepresentativeFcCode(code: string): boolean {
  return code.startsWith("XRC") || code.startsWith("CHA9");
}

/**
 * 반출 아이템 FC 코드 병합 처리
 * @param items - 아이템 배열
 * @returns 처리된 아이템 배열
 */
export function processItems(items: any[]): any[] {
  return items.map((item) => {
    if (
      !Object.keys(item.returnableQtyByFCTotal).some((g) =>
        fcCodesToMerge.has(g)
      )
    ) {
      return item;
    }

    let primaryFcCode: string | null = null;
    for (const fcCode in item.returnableQtyByFCTotal) {
      if (isRepresentativeFcCode(fcCode)) {
        primaryFcCode = fcCode;
        break;
      }
    }

    if (!primaryFcCode) {
      primaryFcCode = "CHA9";
      item.returnableQtyByFCTotal[primaryFcCode] = {
        qty: 0,
        fcName: "CHA9",
      };
    }

    Object.keys(item.returnableQtyByFCTotal)
      .filter((g) => fcCodesToMerge.has(g))
      .forEach((g) => {
        const W = item.returnableQtyByFCTotal[g];
        item.returnableQtyByFCTotal[primaryFcCode!].qty += W?.qty ?? 0;
      });

    Object.keys(item.returnableQtyByFCTotal)
      .filter((g) => fcCodesToMerge.has(g))
      .forEach((g) => {
        delete item.returnableQtyByFCTotal[g];
      });

    return item;
  });
}
