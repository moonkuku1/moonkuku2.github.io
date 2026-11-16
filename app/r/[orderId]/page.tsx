import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultView } from "@/components/result/result-view";

/**
 * 질문 풀이 결과. 주소에는 생년월일을 넣지 않는다(요구사항 7.3). 주문 번호는 임의 값이고,
 * 지금은 결제 연결 전이라 시험 번호(`t-질문번호`)와 견본(`sample`)만 있다. 생년월일은 이 탭에 저장된 값을 서버로 보내 계산한다.
 */
type Props = { params: Promise<{ orderId: string }>; searchParams: Promise<{ q?: string }> };

export const metadata: Metadata = {
  title: "풀이 결과 · 사주300",
  // 개인 풀이라 검색에 나오지 않게 한다
  robots: { index: false, follow: false },
};

export default async function ResultPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { q } = await searchParams;
  const test = /^t-([A-Z]\d{2})$/.exec(orderId);
  const demo = orderId === "sample";
  const questionId = test ? test[1] : demo ? (q && /^[A-Z]\d{2}$/.test(q) ? q : "L04") : null;
  if (!questionId) notFound();
  return <ResultView questionId={questionId} demo={demo} />;
}
