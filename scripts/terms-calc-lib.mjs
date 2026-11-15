// 절기 시각을 천문 계산(VSOP87, astronomia)으로 구한다. 천문연 자료가 없는 연도를 메우는 데 쓴다.
import { deltat, julian, planetposition, solar } from "astronomia";
import earthData from "astronomia/data/vsop87Bearth";

const earth = new planetposition.Planet(earthData);
const RAD = Math.PI / 180;

export const TERM_NAMES = [
  ["소한", 285], ["대한", 300], ["입춘", 315], ["우수", 330], ["경칩", 345], ["춘분", 0],
  ["청명", 15], ["곡우", 30], ["입하", 45], ["소만", 60], ["망종", 75], ["하지", 90],
  ["소서", 105], ["대서", 120], ["입추", 135], ["처서", 150], ["백로", 165], ["추분", 180],
  ["한로", 195], ["상강", 210], ["입동", 225], ["소설", 240], ["대설", 255], ["동지", 270],
];

function jdeOfLongitude(year, lonDeg) {
  // 춘분(0°)쯤인 3월 20일에서 해당 경도까지의 대략적인 일수를 더해 출발하고, 정확한 값으로 좁혀 간다.
  let j = julian.CalendarGregorianToJD(year, 3, 20.5) + (lonDeg / 360) * 365.2422;
  if (lonDeg >= 285) j -= 365.2422; // 1~2월 절기는 같은 해 안에 있도록
  const target = lonDeg * RAD;
  for (let i = 0; i < 50; i++) {
    const a = solar.apparentVSOP87(earth, j);
    let d = target - a.lon;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    j += 58 * d; // 태양은 하루에 약 1/58 라디안 움직인다
    if (Math.abs(d) < 1e-10) break;
  }
  return j;
}

/** 한국 표준시 기준 "분" 단위(1970-01-01 00:00 KST부터의 분). 천문연처럼 가까운 분으로 반올림한다. */
export function termKstMinutes(year, lonDeg) {
  const jde = jdeOfLongitude(year, lonDeg);
  const dT = deltat.deltaT(year + 0.5); // 초
  const ms = julian.JDToDate(jde - dT / 86400).getTime() + 9 * 3600 * 1000;
  return Math.round(ms / 60000);
}

export function minutesToParts(m) {
  const d = new Date(m * 60000);
  const p2 = (n) => String(n).padStart(2, "0");
  return {
    date: `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`,
    time: `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`,
  };
}
