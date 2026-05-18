# Travelseed 직원 테스트 가이드

최종 업데이트: 2026-05-18

## 목적

이 문서는 Travelseed를 다른 직원들과 내부 테스트하기 위한 가이드입니다. 테스트할 때는 숙소 운영자 입장에서 사이트를 만들고, 관리자 대시보드에서 내용을 설정하고, 공개 사이트와 문의/바우처 흐름이 정상 동작하는지 확인합니다.

기본 배포 테스트 주소:

- `https://travelseed.vercel.app`

직원 테스트는 기본적으로 배포 주소에서 진행합니다. 로컬 확인이 필요한 경우에는 `http://localhost:3000`을 사용하고 아래 명령으로 실행합니다.

```bash
npm run dev
```

영문 가이드: `docs/testing-guide.md`

## 테스트 계정 구성

권장 테스트 계정:

- 신규 운영자 계정: 회원가입부터 사이트 생성까지 확인
- 기존 사이트 1개 보유 계정: 로그인 후 사이트 관리 이동 확인
- 여러 사이트 보유 계정: 사이트 목록과 사이트 전환 확인
- 작은 화면 테스트 담당자: 노트북 작은 화면 또는 모바일 폭 브라우저에서 확인

이슈를 기록할 때는 계정 이메일, 사이트명, 사이트 slug, 브라우저, 기기, 테스트 날짜를 함께 남깁니다.

## 전체 테스트 순서

전체 테스트는 아래 순서로 진행합니다.

1. 메인페이지 접속
2. 회원가입 또는 로그인
3. URL AI 생성으로 사이트 만들기
4. 수동 입력 방식으로 사이트 만들기 또는 기존 사이트 확인
5. 관리자 대시보드에서 Setup 체크리스트 진행
6. Pages, Offers, Design, WhatsApp, Settings, Publish 상태 수정
7. 공개 사이트에서 반영 결과 확인
8. 문의, 알림, 바우처 흐름 테스트
9. 작은 화면에서 주요 화면 재확인

## 기능별 체크리스트

### 메인페이지와 계정 이동

- 메인페이지가 깨진 링크 없이 로딩되는지 확인
- EN/ID 언어 전환 토글이 보이고 새로고침 후에도 유지되는지 확인
- 언어 전환 시 메인페이지, 로그인, 생성, 공통 navigation 문구가 바뀌는지 확인
- 로그아웃 상태 CTA가 사이트 생성으로 이어지는지 확인
- 로그인 상태에서 기존 사이트가 있으면 사이트 관리로 이동하는지 확인
- 로그인 상태에서 사이트가 없으면 사이트 생성으로 이동하는지 확인
- 하단 샘플 사진 목록은 보이되 깨진 데모 링크로 이동하지 않는지 확인

### 사이트 생성

- `/create` 페이지가 신규 운영자에게 정상 표시되는지 확인
- 필수 정보를 수동 입력해서 사이트를 만들 수 있는지 확인
- URL 입력 후 AI 생성이 시작되는지 확인
- URL AI 생성 중 `Generate with AI` 버튼에 circular progress 아이콘과 disabled 로딩 상태가 보이는지 확인
- AI가 채운 draft 내용을 생성 전에 수정할 수 있는지 확인
- 이미지 업로드와 템플릿 선택이 레이아웃 깨짐 없이 동작하는지 확인
- 생성 완료 후 관리 흐름으로 이동하는지 확인

### 대시보드 기본 구조

- `/dashboard`에서 내 사이트 목록이 1열 넓은 카드 형태로 보이는지 확인
- `/dashboard/[siteId]`에서 선택한 사이트 관리 화면이 열리는지 확인
- EN/ID 언어 전환 시 대시보드 사이드바 메뉴명이 바뀌는지 확인
- 작은 화면에서도 좌측 메뉴가 잘리지 않고 사용 가능한지 확인
- Dashboard와 Setup의 진행률 퍼센트가 일치하는지 확인
- 저장하지 않은 변경사항이 있을 때 메뉴 이동 경고가 뜨는지 확인

### Setup

- Setup이 모든 내용을 직접 수정하는 화면이 아니라 체크리스트 허브로 동작하는지 확인
- 각 단계 CTA가 담당 메뉴로 이동하는지 확인
- Business Info는 Settings로 이동
- OTA / Existing Info는 Import로 이동
- AI Brand Copy는 AI Copy로 이동
- Choose Template은 Design으로 이동
- Preview & Publish는 Settings로 이동
- 완료 상태가 실제 사이트 데이터 기준으로 업데이트되는지 확인

### Pages와 Content

- 멀티페이지 사이트에서 Pages가 기본 CMS 메뉴로 동작하는지 확인
- 랜딩이 아닌 사이트에서 Content가 Pages 흐름으로 연결되는지 확인
- Home, Rooms, Dining, Promotions, Reviews 등 기본 페이지가 플랜에 맞게 보이는지 확인
- publish/unpublish 변경이 공개 페이지 노출에 반영되는지 확인
- Home은 별도 page hero가 아니라 site hero를 사용하는지 확인
- Subpage는 page-level hero 이미지를 사용할 수 있는지 확인
- preset content editor에서 title, intro, item list, CTA label, preset-specific fields가 저장되는지 확인
- 공개 subpage에 저장한 preset content가 반영되는지 확인

### Offers

- Room, Package, Service offer를 생성, 수정, 삭제할 수 있는지 확인
- Room 전용 필드는 room offer에서만 보이는지 확인
- Bed type, room size, occupancy, view, amenities, booking label이 저장되는지 확인
- Package와 Service offer는 campaign badge로 Promotions 노출 설정이 가능한지 확인
- 공개 Rooms와 Promotions 페이지에 저장한 offer가 반영되는지 확인
- 저장 실패 상황에서 기존 offer가 사라지지 않는지 확인

### Design과 Templates

- 템플릿 카드를 선택할 수 있는지 확인
- Sunset, Tropical Villa, Boutique Resort, Surf Camp preview가 각각의 디자인 방향으로 표시되는지 확인
- Boutique Resort 멀티페이지 navigation이 많은 메뉴에서도 깨지지 않는지 확인
- Customise colors가 선택한 템플릿의 기본 컬러 팔레트에서 시작하는지 확인
- 컬러 변경이 대시보드 preview와 공개 사이트에 반영되는지 확인
- desktop/mobile responsive preview가 선택한 템플릿에 맞게 변경되는지 확인
- mobile preview가 iPhone 느낌의 프레임으로 보이고 하단 주요 콘텐츠가 잘리지 않는지 확인
- 필요한 경우 공개 preview에서 WhatsApp floating button이 보이는지 확인

### WhatsApp, Inquiries, Notifications

- WhatsApp 번호와 booking message가 저장되는지 확인
- 공개 사이트 booking CTA가 의도한 WhatsApp 흐름으로 열리는지 확인
- 테스트 데이터가 있을 때 새 inquiry가 Inquiries에 표시되는지 확인
- 새 inquiry 수가 dashboard notification count에 반영되는지 확인
- inquiry 상태를 `new`에서 다른 상태로 바꾸면 notification count가 줄어드는지 확인
- confirmed inquiry에서 voucher draft를 만들거나 재사용할 수 있는지 확인

### Vouchers

- manual voucher draft를 만들 수 있는지 확인
- confirmed inquiry에서 voucher draft를 만들 수 있는지 확인
- room offer를 선택하면 room label과 관련 booking field가 채워지는지 확인
- room label은 수동 수정 가능한지 확인
- draft voucher field가 저장되는지 확인
- issue 후 public voucher link가 활성화되는지 확인
- public voucher URL 형식이 `/{slug}/vouchers/{publicToken}`인지 확인
- issued voucher에서 copy link와 WhatsApp share가 동작하는지 확인
- draft voucher는 삭제 가능한지 확인
- issued voucher는 삭제가 아니라 void 처리되는지 확인
- void voucher가 활성 confirmation처럼 수정되지 않는지 확인

### Settings와 Publishing

- 기본 사이트 설정이 저장되는지 확인
- public URL preview가 이해하기 쉽게 표시되는지 확인
- publish/pause 동작이 공개 사이트 접근 상태에 반영되는지 확인
- 비밀번호 변경에서 현재 비밀번호, 새 비밀번호 길이, 확인 비밀번호 불일치 검증이 동작하는지 확인
- 비밀번호 변경 후 다시 로그인할 수 있는지 확인

## 이슈 기록 양식

직원 피드백은 아래 형식으로 받습니다.

```text
테스트 환경:
- URL:
- 기기:
- 브라우저:
- 계정:
- 사이트명 / slug:

문제 위치:
- 페이지 URL:
- 대시보드 메뉴:

재현 단계:
1.
2.
3.

기대 결과:

실제 결과:

스크린샷 또는 영상:

심각도:
- Blocker / Major / Minor / Polish
```

## 완료 기준

- 신규 운영자가 설명 없이 사이트 생성까지 완료할 수 있음
- Setup이 다음 작업을 명확히 안내하고 올바른 메뉴로 이동시킴
- 대시보드가 작은 화면에서도 사용 가능함
- Pages 기반 CMS와 멀티페이지 routing이 유지됨
- Offers 변경이 공개 Rooms와 Promotions 콘텐츠에 안정적으로 반영됨
- URL AI 생성 중 진행 상태가 명확히 보임
- 템플릿 preview와 공개 사이트 렌더링이 크게 어긋나지 않음
- 공개 사이트 CTA, inquiry, voucher가 기본 direct-booking 흐름을 지원함

## 이번 테스트 범위 제외

- 결제 수집
- OTA sync
- 객실 재고 관리
- 바우처 PDF export
- 세금계산서, 인보이스 등 법적 문서 기능
- 자동화된 성능/부하 테스트
