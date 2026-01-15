# 라이센스 검증 시스템

## 개요

이 확장 프로그램은 다음과 같은 방식으로 라이센스를 검증합니다:

1. **주기적 검증**: 10분마다 자동으로 라이센스 유효성 검증
2. **액션 기반 검증**: 중요한 기능 실행 시마다 검증
3. **브라우저 ID 검증**: 라이센스가 현재 브라우저에서 활성화되었는지 확인

## 검증 트리거

### 1. 주기적 검증 (Periodic Validation)

**시점**: 확장 프로그램 시작 후 10분마다

**구현**: `modules/core/license-validator.ts` - `startPeriodicValidation()`

```typescript
// Background script에서 자동 시작
startPeriodicValidation();
```

**검증 내용**:
- 라이센스 존재 여부
- 라이센스 만료일 확인
- 브라우저 ID 일치 여부
- 백엔드 API 호출 (실제 서버에서 라이센스 상태 확인)

**실패 시 동작**:
- 로컬 라이센스 삭제
- Context 메뉴를 "라이센스 활성화 필요"로 변경
- 콘솔에 경고 메시지 출력

### 2. 액션 기반 검증 (Action-based Validation)

**시점**: 사용자가 다음 기능을 실행할 때마다

- 상품 지표 보기 (`VIEW_PRODUCT_METRICS`)
- 로켓그로스 반출 Excel 다운로드 (`ROCKETGROSS_EXPORT_EXCEL`)

**구현**: `modules/core/license-validator.ts` - `validateLicenseOnAction()`

```typescript
// 중요한 액션 전에 검증
const isValid = await validateLicenseOnAction();
if (!isValid) {
  // 액션 차단
  return;
}
```

**검증 내용**: 주기적 검증과 동일

**실패 시 동작**:
- 액션 실행 차단
- Context 메뉴 재초기화
- 사용자에게 라이센스 활성화 필요 메시지 표시

### 3. Storage 변경 감지

**시점**: 라이센스 정보가 storage에서 추가/변경/삭제될 때

**구현**: `entrypoints/background.ts` - storage change listener

```typescript
browser.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "local" && changes.ct_license) {
    // 라이센스 변경 감지 시 검증
    await validateLicenseOnAction();
    await initializeContextMenus();
  }
});
```

## 브라우저 ID 시스템

### 목적

하나의 라이센스가 여러 브라우저에서 동시에 사용되는 것을 방지

### 동작 방식

1. **ID 생성**: 첫 실행 시 고유한 브라우저 ID 생성
   - 형식: `{timestamp}-{random}{random}`
   - 예: `1705123456789-abc123xyz789`

2. **ID 저장**: `chrome.storage.local`에 영구 저장

3. **라이센스 활성화**: 라이센스 활성화 시 브라우저 ID 함께 전송

4. **검증**: 저장된 라이센스의 브라우저 ID와 현재 브라우저 ID 비교

### 시나리오

#### 정상 케이스
```
브라우저 A에서 라이센스 활성화
→ browserId: "xxx" 저장
→ 검증 시 항상 일치
→ 정상 동작
```

#### 다른 브라우저 활성화 케이스
```
브라우저 A에서 라이센스 활성화 (browserId: "xxx")
→ 브라우저 B에서 동일 라이센스 활성화 (browserId: "yyy")
→ 백엔드에서 browserId "yyy"로 업데이트
→ 브라우저 A에서 검증 시 ID 불일치
→ 브라우저 A의 라이센스 자동 삭제
```

## 검증 흐름도

```
┌─────────────────────────────────────────┐
│  확장 프로그램 시작                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  startPeriodicValidation() 실행          │
│  - 즉시 1회 검증                          │
│  - 10분마다 반복 검증                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  사용자가 기능 실행 (예: 상품 지표 보기)    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  validateLicenseOnAction() 실행          │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   [검증 성공]        [검증 실패]
        │                 │
        ▼                 ▼
   기능 실행          라이센스 삭제
                     메뉴 업데이트
                     액션 차단
```

## 백엔드 API (Mock)

현재는 Mock API로 구현되어 있으며, 실제 서비스에서는 다음과 같이 구현해야 합니다:

### 엔드포인트

#### 1. POST /api/license/validate

**Request**:
```json
{
  "email": "user@example.com",
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "browserId": "1705123456789-abc123xyz789"
}
```

**Response** (성공):
```json
{
  "valid": true,
  "license": {
    "email": "user@example.com",
    "licenseKey": "XXXX-XXXX-XXXX-XXXX",
    "status": "ACTIVE",
    "expiresAt": "2025-12-31T23:59:59Z",
    "browserId": "1705123456789-abc123xyz789"
  }
}
```

**Response** (실패 - 다른 브라우저에서 활성화됨):
```json
{
  "valid": false,
  "error": "LICENSE_DEACTIVATED",
  "message": "이 라이센스는 다른 브라우저에서 활성화되었습니다."
}
```

#### 2. POST /api/license/activate

**Request**:
```json
{
  "email": "user@example.com",
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "browserId": "1705123456789-abc123xyz789"
}
```

**Response**:
```json
{
  "ok": true,
  "license": {
    "email": "user@example.com",
    "licenseKey": "XXXX-XXXX-XXXX-XXXX",
    "status": "ACTIVE",
    "activatedAt": "2025-01-15T10:00:00Z",
    "expiresAt": "2026-01-15T10:00:00Z",
    "browserId": "1705123456789-abc123xyz789"
  }
}
```

## 보안 고려사항

1. **API 통신 암호화**: HTTPS 필수
2. **Rate Limiting**: 무차별 대입 공격 방지
3. **Token 기반 인증**: API 요청 시 secure token 사용
4. **브라우저 ID 변조 방지**: 서버에서 browserId 관리
5. **로그 모니터링**: 비정상적인 활성화 패턴 감지

## 테스트

### 개발 환경에서 빠른 검증 테스트

```typescript
// modules/core/license-validator.ts
// 주석 해제하여 30초마다 검증
const VALIDATION_INTERVAL = 30 * 1000; // 30 seconds
```

### 콘솔 로그 확인

```
[License Validator] Starting periodic validation
[License Validator] Validating license on action
[Browser ID] Using existing browser ID: xxx
[License Validator] Validating license { email: '...', browserId: '...' }
[License Validator] License is valid
```

### 테스트 시나리오

1. **정상 사용**: 라이센스 활성화 후 10분 대기 → 자동 검증 확인
2. **만료 테스트**: expiresAt을 과거로 설정 → 검증 실패 확인
3. **브라우저 ID 불일치**: 수동으로 browserId 변경 → 검증 실패 확인
4. **다중 브라우저**: 두 브라우저에서 순차적으로 활성화 → 첫 번째 브라우저에서 검증 실패 확인
