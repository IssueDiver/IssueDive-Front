# 🎨 IssueDive - Frontend

## GitHub 이슈 트래커 클론 프로젝트
### 프로젝트 개요
> IssueDive는 개발자들의 필수 협업 도구인 GitHub 이슈 트래커의 핵심 기능을 구현한 Full-Stack 프로젝트입니다. </br>
> 이 레포지토리에서는 IssueDive의 <u>**프론트엔드 UI**</u>를 다룹니다. </br>
> Vue.js 3, TypeScript, 그리고 Pinia를 사용하여 반응성이 뛰어나고 상태 관리가 용이한 SPA(Single Page Application)를 구축했습니다.
>
> 🔗 [Go To Backend Repository](https://github.com/IssueDiver/IssueDive)

 </br>
 
### 🎥 시연 영상
> [▶️ 유튜브에서 보기](https://youtu.be/o04gjUN-XKA?si=qn_dW2u2diJXHXUe)

![Image](https://github.com/user-attachments/assets/fb44b262-b4ee-4ba1-aca1-5d29bfe18e6d)

 </br>

 
## ✨ 주요 기능/비기능 요구사항
|  |  |
| ----------- | ------------------------ |
| 🖥️ 반응형 UI | Tailwind CSS를 사용하여 데스크탑, 태블릿, 모바일 등 다양한 화면 크기에 최적화된 UI 제공 |
| 📄 이슈 목록 | 동적 필터링(상태, 담당자, 라벨 등), 키워드 검색(디바운싱 적용), 정렬(최신순, 댓글순 등) 기능을 갖춘 이슈 목록 페이지 |
| ➕ 이슈 생성 및 수정 | 담당자/라벨을 쉽게 지정할 수 있는 UI를 통해 새로운 이슈를 생성하고 수정 | 
| 🏷️ 라벨 관리 | 모달(Modal) UI를 통해 일관된 사용자 경험으로 라벨을 생성, 수정, 삭제 | 
| 🔐 인증 | JWT 토큰 기반의 로그인/회원가입 기능 및 페이지 접근 제어(Navigation Guard) | 
| ✨ UX 개선 | 회원가입 즉시 자동 로그인, 세션 만료 시 중복 없는 알림, 사용자 친화적인 에러 메시지, 툴팁(Tooltip) 등 사용자 경험을 향상시키기 위한 다양한 디테일을 구현 | 

 </br>

## 🛠️ 기술 스택
|  |  |
| ----------- | ------------------------ |
| **Backend** | `Java 17`, `Spring Boot 3.5`, `Spring Security`, `JPA/Hibernate`, `QueryDSL`, `JUnit5` |
| **Database** | `MySQL 8.0`, `H2 (Test)`, `Redis (JWT Blacklist, 캐싱)`, `AWS RDS` |
| **Frontend** | `Vue.js 3`, `Pinia`, `Vue Router`, `Axios`, `Tailwind CSS` |
| **DevOps & Infra** | `Docker`, `Docker Compose`, `AWS EC2`, `Nginx`, `GitHub Actions (CI/CD)`, `Flyway`, `K6` |
| **Monitoring** | `Spring Boot Actuator`, `Prometheus`, `Grafana` |
| **Tools** | `IntelliJ, VSCode`, `MySQL Workbench`, `Postman, Swagger`, `Notion`, `Mermaid, DBdiagram`, `ChatGPT, Gemini, Claude` |

 </br>
 
## 프로젝트 구조
```plaintext
src/
├── api/          # Axios 인스턴스 및 인터셉터 설정
├── assets/       # CSS, 이미지 등 정적 에셋
├── components/   # 재사용 가능한 UI 컴포넌트 (IssueList, LabelManager 등)
├── config/       # Mock 데이터 등 설정 관련 파일
├── router/       # Vue Router 설정 (페이지 라우팅, 네비게이션 가드)
├── stores/       # Pinia 상태 관리 (인증 상태 등)
├── types/        # TypeScript 타입 정의 (Interface)
├── utils/        # 공통 유틸리티 함수 (색상 계산 등)
└── views/        # 페이지 레벨의 메인 컴포넌트 (HomeView, IssueDetail 등)
```

 </br>
 
## ⚙️ 실행 방법

**사전 요구사항**
- Node.js (v20.x 이상)
- 백엔드 서버가 실행 중이어야 합니다. ([백엔드 레포지토리](https://github.com/IssueDiver/IssueDive) 참고)

</br>

### 로컬 환경에서 실행하기

1. 레포지토리 클론
```bash
git clone [https://github.com/IssueDiver/IssueDive-Front.git](https://github.com/IssueDiver/IssueDive-Front.git)
cd IssueDive-Front
```

2. 의존성 설치
`npm install`

3. 개발 서버 실행
`npm run dev`

4. 확인
웹 브라우저에서 http://localhost:5173/ 에 접속합니다.

 </br>
 

## 환경 변수
| 이름        | 설명          | 예시 |
|-------------|---------------|---------------------------------------------|
| DB_HOST     | RDS 엔드포인트 | issuedive-mysql.cro4kgswk31z.ap-northeast-2.rds.amazonaws.com |
| DB_PORT     | DB 포트       | 3306 |
| DB_NAME     | DB 이름       | issue_dive |
| DB_USER     | DB 사용자     | issue |
| DB_PASSWORD | DB 비밀번호   | password |


 </br>
 
## 👨‍💻 팀원 소개
|  |  | 
| ------- | ------------------------ |
| 은지우 [@meraki6512](https://github.com/meraki6512) | 팀장, BE(Issue) 및 FE(전체) 개발, CI/CD 구축, 성능/보안 개선, 문서화 |
| 김소연 [@soyeonkim8888](https://github.com/soyeonkim8888) | BE(Auth), 통합 테스트 |
| 이성채 [@sungchaelee](https://github.com/sungchaelee) | BE(Comment), 모니터링, 성능 개선| 
| 박세현 [@tpgus1221](https://github.com/tpgus1221) | BE(Label), AWS 배포, API 테스트 |

 </br>
 
## 📜 주요 산출물
> 프로젝트의 모든 기획, 설계, 분석 문서는 아래에서 확인하실 수 있습니다.

최종 기획안: [최종 기획안 Docs](https://docs.google.com/document/d/1jfvVWbFgSDaRamZesPRmYq2iongn2wFI7nE7zk9sBHE/edit?usp=sharing)</br>
발표 자료 (PPT): [Canva](https://goorm1.my.canva.site/srs) </br>
API 문서: [API 문서: 구글 Docs](https://docs.google.com/document/d/1diZlPkwtpfGbaEFJLG5SJ9BtdPSveXviEPdpxa_v68o/edit?usp=sharing)</br>
기타 산출물: [아키텍처](https://docs.google.com/document/d/1e0JMy1z6Nv5pb8Lywc3qrn2HuxVPGVb1RBexY8rbz2E/edit?usp=sharing), [ERD](https://docs.google.com/document/d/1h-k7Cc9a9ARHyEtdl79sAzWNCa4oorkFAdWqZq1txNQ/edit?usp=sharing), [UseCase](https://docs.google.com/document/d/1PGSe9AeDiN5K-a2h0W_j1vNkOygp08VjHJvU5uDO54Y/edit?usp=sharing), [성능 개선 리포트](https://docs.google.com/document/d/1kvfYity9uiEIDRoL7CH8wyMazn8fBueM_yYeXI6dyYE/edit?usp=sharing), [보안 개선 리포트](https://docs.google.com/document/d/1xnmfO1ng1z5CZWww3pXyERA_fSbJ8TcRGBN_yEBK0Ow/edit?usp=sharing)

### Diagram
<table>
<tr>
<td align="center"><strong>ERD (데이터베이스 구성도)</strong></td>
<td align="center"><strong>Use Case Diagram</strong></td>
</tr>
<tr>
<td><img width="400" alt="ERD (데이터베이스 구성도)" src="https://github.com/user-attachments/assets/81adbe8e-6408-4158-8aee-6bdce650bf3e" /></td>
<td><img width="400" alt="Use Case Diagram" src="https://github.com/user-attachments/assets/1c6ea4eb-b2cf-40cb-bd00-4e8c1fafab69" /></td>
</tr>
</table>

### Architecture
<table>
<tr>
<td align="center"><strong>백엔드 상세 아키텍처 (Layered)</strong></td>
<td align="center"><strong>CI/CD 및 배포 아키텍처</strong></td>
</tr>
<tr>
<td><img width="400" alt="Backend Architecture" src="https://github.com/user-attachments/assets/49b66fd2-0c60-4ea3-acde-4a0f04f92f6d" /></td>
<td><img width="400" alt="CI/CD Architecture" src="https://github.com/user-attachments/assets/aeaad4c3-6490-46f3-8611-bba1530b9766" /></td>
</tr>
</table>

<br>


