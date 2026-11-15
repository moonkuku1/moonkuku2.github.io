// 확인용: 실행 중인 서버(기본 http://localhost:3100)의 /api/answer를 몇 번 불러 본다. 사용법: node scripts/smoke-answer.mjs [주소]
const base = process.argv[2] ?? "http://localhost:3100";
const post = async (body) => {
  const res = await fetch(`${base}/api/answer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, json: await res.json() };
};
const person = { calendar: "solar", year: 2000, month: 1, day: 1, hour: 0, minute: 30, gender: "male", name: "민준" };

for (const q of ["L04", "J03", "Y02", "M01"]) {
  const { status, json } = await post({ ...person, questionId: q });
  console.log(`${q} [${status}] 풀이꾼=${json.guide} 샘플=${json.sample} 확신도=${json.verdict?.confidence} 출처=${json.meta?.source}`);
  console.log(`   headline: ${json.answer?.headline}`);
  console.log(`   story ${Array.from(json.answer?.story ?? "").length}자: ${json.answer?.story?.slice(0, 70)}...`);
  console.log(`   action: ${json.answer?.action?.do} (${json.answer?.action?.by})`);
}
const again = await post({ ...person, questionId: "L04" });
console.log("같은 질문 다시:", again.json.meta?.source);
const bad = await post({ year: 1 });
console.log("잘못된 입력:", bad.status);
const impossible = await post({ ...person, month: 2, day: 30, questionId: "L04" });
console.log("2월 30일:", impossible.status, impossible.json.error);
