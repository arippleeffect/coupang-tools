# 쿠팡 지표 분석 크롬 익스텐션

쿠팡 상품 지표를 분석하고 데이터를 Excel로 내보낼 수 있는 크롬 익스텐션입니다.

## 주요 기능

### 1. 상품 지표 분석
- 쿠팡 검색 결과 페이지에서 상품별 지표 확인
- 최근 28일 기준 페이지뷰(PV), 판매량, 전환율, 매출 데이터 표시
- 일반 상품과 광고 상품 구분
- 실시간 데이터 조회 및 재시도 기능

### 2. 상품 상세 정보
- 개별 상품 페이지에서 상세 지표 표시
- 브랜드명, 상품 ID, 판매 지표 등 제공

### 3. Excel 내보내기
- 상품 지표 데이터를 Excel 파일로 내보내기
- 일반 상품과 광고 상품을 별도 시트로 구분
- 자동 날짜/시간 포함 파일명 생성

### 4. 라이선스 관리
- 이메일 기반 라이선스 활성화
- Supabase 기반 인증 시스템
- 주기적인 라이선스 유효성 검증

## 기술 스택

- **프레임워크**: WXT (Chrome Extension Framework)
- **UI**: React 19
- **언어**: TypeScript
- **빌드 도구**: Vite
- **데이터 처리**: XLSX (SheetJS)
- **인증**: Supabase
- **유틸리티**: Remeda

## 개발 환경 설정

### 1. 필수 요구사항
- Node.js 18 이상
- pnpm (권장)

### 2. 설치
```bash
pnpm install
```

### 3. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
VITE_SUPABASE_KEY=your_supabase_publishable_key
VITE_SUPABASE_URL=your_supabase_url
```

### 4. 개발 서버 실행
```bash
# Chrome 개발 모드
pnpm dev

# Firefox 개발 모드
pnpm dev:firefox
```

### 5. 빌드
```bash
# Chrome 프로덕션 빌드
pnpm build

# Firefox 프로덕션 빌드
pnpm build:firefox
```

### 6. 배포용 압축 파일 생성
```bash
# Chrome용 zip 파일 생성
pnpm zip

# Firefox용 zip 파일 생성
pnpm zip:firefox
```

## 프로젝트 구조

```
├── entrypoints/          # 익스텐션 엔트리포인트
│   ├── background.ts     # 백그라운드 스크립트
│   ├── content.tsx       # 컨텐츠 스크립트
│   └── license.html      # 라이선스 활성화 페이지
├── modules/              # 핵심 모듈
│   ├── api/              # API 통신
│   │   ├── client.ts     # 쿠팡 API 클라이언트
│   │   └── license.ts    # 라이선스 API
│   ├── core/             # 핵심 기능
│   │   ├── dom.ts        # DOM 유틸리티
│   │   ├── state.ts      # 상태 관리
│   │   ├── license-storage.ts      # 라이선스 저장소
│   │   └── license-validator.ts    # 라이선스 검증
│   ├── features/         # 기능 모듈
│   │   ├── excel-export/           # Excel 내보내기
│   │   ├── product-info/           # 상품 정보 표시
│   │   ├── product-metrics/        # 상품 지표 분석
│   │   └── license/                # 라이선스 관리
│   └── constants/        # 상수 정의
└── types/                # TypeScript 타입 정의
```

## 사용 방법

### 라이선스 활성화
1. 익스텐션 아이콘 클릭
2. 이메일과 라이선스 키 입력
3. "활성화" 버튼 클릭

### 상품 지표 보기
1. 쿠팡 검색 결과 페이지 접속 (www.coupang.com 또는 shop.coupang.com)
2. 페이지에서 우클릭
3. "쿠팡 상품 지표보기" 선택
4. 상품별 지표가 화면에 표시됨

### Excel 내보내기
1. 상품 지표를 확인한 후
2. 화면 우측 하단의 "Excel 다운로드" 버튼 클릭
3. 일반 상품과 광고 상품이 분리된 Excel 파일 다운로드

## 주요 기능 설명

### 라이선스 시스템
- Activation Token 기반 인증
- 로컬 스토리지에 라이선스 정보 저장
- 1시간마다 자동 검증
- 사용자 액션 시 캐시 기반 빠른 검증 (5분 TTL)

### 상품 지표 수집
- 쿠팡윙 API를 통한 실시간 데이터 조회
- 배치 검색으로 여러 상품 동시 조회
- 실패한 상품 개별 재시도
- 로그인 상태 자동 감지

### Excel 내보내기
- 일반 상품과 광고 상품 분리
- 자동 날짜/시간 포함 파일명 생성 (products_YYYYMMDD_HHMMSS.xlsx)
- UTF-8 인코딩 지원

## 보안

- API 키는 환경 변수로 관리
- Activation Token은 로컬 스토리지에 저장 (크롬 익스텐션 특성상 완벽한 보안 불가)
- CORS 제한 없이 쿠팡윙 API 접근 (익스텐션 권한 활용)

## 알려진 제한사항

1. **토큰 보안**: 로컬 스토리지는 개발자 도구로 접근 가능하므로 악의적인 사용자가 토큰 추출 가능
2. **쿠팡윙 로그인 필수**: 상품 지표 조회를 위해 쿠팡윙 세션 쿠키 필요
3. **API 제한**: 쿠팡 API의 Rate Limiting에 따라 과도한 요청 시 일시적 차단 가능
4. **브라우저 제한**: Chrome/Edge 등 Chromium 기반 브라우저에서만 동작

## 라이선스

이 프로젝트는 비공개 소프트웨어이며, 라이선스가 필요합니다.

## 지원

문의사항이나 버그 리포트는 관리자에게 연락 주세요.
