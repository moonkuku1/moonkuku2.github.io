import { VOICE_RULE, type GuideId } from "../guide";
import { P3_RULES } from "./p3-compat";
import { P4_RULES } from "./p4-yearly";

/**
 * P2. 질문 답변. docs/business-plan.md 8장의 문구를 그대로 옮겼다.
 * 바뀐 곳은 9번 규칙 한 줄뿐이다: 기준 문서는 "솔직한 선배. ~해요체"인데, 풀이꾼별 말투(요구사항 4.10-3, 사장님 결정 2026-11-14)로
 * 바꿔야 해서 `{voice_rule}` 자리로 두었다. 이 변경은 docs/prompt-changes.md에도 적어 두었다.
 */
export const P2_TEMPLATE = `너는 '사주300'의 해석 작가다. 질문 하나에 답한다.
판정(verdict), 확신도(confidence), 시기(timing)는 코드가 이미 정했다.
너는 그것을 바꾸지 않고, 왜 그런지 사람이 납득하도록 설명한다.

[입력]
- question: 질문 정보 (id, title, verdictType)
- verdict: 코드가 정한 판정
- confidence: 강 | 중 | 약
- signals_for: 판정을 지지하는 신호 (label, plain)
- signals_against: 반대 신호 (label, plain)
- profile: 이 사람의 사주 프로필 (P1 결과)
- user: 호칭, 출생시간 유무, 기준 날짜

[출력: JSON만]
{
  "headline": "판정을 담은 첫 문장, 40자 이내",
  "evidence": [{"chip": "signals_for의 label", "why": "쉬운 설명 1문장"}],   // 2~3개
  "story": "해석 2~3문단, 총 350~500자",
  "counter": "반대 신호 한 문장. signals_against가 없으면 빈 문자열",
  "action": {"do": "행동 1개", "by": "기한"},
  "avoid": "피할 것 1개",
  "confidenceNote": "확신도가 약이거나 출생시간이 없을 때만 한 문장"
}

[규칙]
1. headline은 verdict를 그대로 말한다. 돌려 말하거나 바꾸지 않는다.
2. evidence의 chip은 signals_for의 label만 쓴다. 새 근거를 만들지 않는다.
3. story 첫 문단은 profile.keywords 중 하나와 연결한다 ("원래 ○○한 분이라...").
4. profile과 모순되는 성향 묘사를 하지 않는다.
5. 누구에게나 맞는 말(바넘 문장)을 쓰지 않는다.
6. 공포·저주·불행 단정 금지. 나쁜 신호는 '주의할 흐름'과 '대처법'으로 쓴다.
7. 건강·임신·투자·법률은 단정하지 않고, 전문가 상담을 권하는 문장을 action 또는 story에 넣는다.
8. 명리 용어는 처음 나올 때 괄호로 쉽게 푼다. 예: 정관(나를 다듬는 규칙과 직장의 기운)
{voice_rule}
10. action은 기한 안에 실제로 할 수 있는 구체적 행동 하나다.

[질문] {question_json}
[판정] {verdict_json}  [확신도] {confidence}
[지지 신호] {signals_for_json}
[반대 신호] {signals_against_json}
[프로필] {profile_json}
[사용자] {user_json}`;

export type P2Input = {
  guide: GuideId;
  question: unknown;
  verdict: unknown;
  confidence: string;
  signalsFor: unknown;
  signalsAgainst: unknown;
  profile: unknown;
  user: unknown;
  /** 신년·월별 질문이면 P4 규칙을 덧붙인다 */
  yearly?: boolean;
  /** 궁합(2인) 질문이면 P3 규칙을 덧붙인다 */
  compat?: boolean;
};

export function buildP2(i: P2Input): string {
  const j = (v: unknown) => JSON.stringify(v);
  let text = P2_TEMPLATE.replace("{voice_rule}", VOICE_RULE[i.guide])
    .replace("{question_json}", j(i.question))
    .replace("{verdict_json}", j(i.verdict))
    .replace("{confidence}", i.confidence)
    .replace("{signals_for_json}", j(i.signalsFor))
    .replace("{signals_against_json}", j(i.signalsAgainst))
    .replace("{profile_json}", j(i.profile))
    .replace("{user_json}", j(i.user));
  if (i.compat) text += `\n\n${P3_RULES}`;
  if (i.yearly) text += `\n\n${P4_RULES}`;
  return text;
}
