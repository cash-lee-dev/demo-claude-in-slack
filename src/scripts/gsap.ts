/**
 * GSAP 單一入口：註冊本專案用到的外掛。
 * 其他模組一律從這裡 import { gsap, Observer, SplitText, ScrollTrigger }，不要直接 import 'gsap'，
 * 以確保外掛只註冊一次。
 *
 * - Observer：整頁切換引擎的滾輪 / 觸控輸入（screens/engine.ts）
 * - SplitText：屏內文字逐字 / 逐行入場
 * - ScrollTrigger：引擎本身不依賴捲動位置；保留給「屏內自有捲動區」之類的特殊內容使用
 */
import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(Observer, SplitText, ScrollTrigger);
gsap.config({ nullTargetWarn: false });

export { gsap, Observer, SplitText, ScrollTrigger };
