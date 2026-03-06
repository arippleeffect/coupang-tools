const DEVICE_ID_KEY = "ct_device_id";

/**
 * 기기 고유 ID를 가져오거나 새로 생성
 * 한 번 생성되면 익스텐션 삭제 전까지 유지
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const result = await browser.storage.local.get(DEVICE_ID_KEY);
  if (result[DEVICE_ID_KEY]) {
    return result[DEVICE_ID_KEY];
  }

  const deviceId = crypto.randomUUID();
  await browser.storage.local.set({ [DEVICE_ID_KEY]: deviceId });
  return deviceId;
}
