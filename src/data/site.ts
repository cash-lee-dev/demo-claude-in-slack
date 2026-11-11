/**
 * 站台共用資料：導覽、頁尾、站內連結 helper。
 * 新增 / 修改導覽項目只改這裡，Navbar / Footer / 解決方案示範頁都讀這份資料。
 */

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** 產生站內連結（自動帶 GitHub Pages 的 base path）。path 以 / 開頭，目錄型路徑請以 / 結尾。 */
export const url = (path = '/'): string => `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

/** 原站網址（尚未重建的頁面先連回原站；確認正式網址後再逐一替換） */
export const ORIGIN_SITE = 'https://may4s.com/tw/';

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface SolutionItem {
  /** 解決方案頁中對應的「屏」id（深連結 /solutions/#planet-N） */
  id: string;
  label: string;
  desc: string;
}

/** 解決方案：前 3 項為產業解決方案，後 4 項為軟體與平台 */
export const industrySolutions: SolutionItem[] = [
  { id: 'planet-1', label: '客製化製造電商', desc: '客製報價、訂單到出貨的一條龍流程' },
  { id: 'planet-2', label: '售後服務管理', desc: '工單、保固與現場服務的即時協作' },
  { id: 'planet-3', label: '經銷商與代理商管理', desc: '通路夥伴的訂單、庫存與績效一覽' },
];

export const softwareSolutions: SolutionItem[] = [
  { id: 'planet-4', label: 'Salesforce CRM 系統', desc: '以客戶為中心的銷售、服務與行銷' },
  { id: 'planet-5', label: 'Slack 企業通訊協作', desc: '把團隊、資料與流程集中在同一個頻道' },
  { id: 'planet-6', label: 'LAURELIN 法務治理平台', desc: '合約、合規與法務流程治理' },
  { id: 'planet-7', label: 'Shopify 電商平台', desc: '品牌電商的快速上線與整合' },
];

export const allSolutions: SolutionItem[] = [...industrySolutions, ...softwareSolutions];

/** 解決方案深連結：/solutions/#planet-N */
export const solutionHref = (id: string): string => url(`/solutions/#${id}`);

/** 導覽列的其他連結（這些頁面不在 CTCC-13 範圍，先連回原站） */
export const navLinks: NavLink[] = [
  { label: '新聞中心', href: ORIGIN_SITE, external: true }, // TODO: 確認原站正式網址
  { label: '活動與講座', href: ORIGIN_SITE, external: true },
  { label: '關於我們', href: ORIGIN_SITE, external: true },
  { label: '招募夥伴', href: ORIGIN_SITE, external: true },
];

export const contactLink: NavLink = { label: '聯絡我們', href: url('/contact/') };

/** 頁尾連結 */
export const footerLinks = {
  privacy: { label: '隱私權聲明', href: ORIGIN_SITE }, // TODO: 確認原站隱私權聲明網址
  slackCases: { label: 'Slack 案例', href: 'https://slack.com/customer-stories' },
  email: { label: 'info@may4s.com.tw', href: 'mailto:info@may4s.com.tw' },
  linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/' }, // TODO: 換成 May4s 官方粉專
  facebook: { label: 'Facebook', href: 'https://www.facebook.com/' }, // TODO: 換成 May4s 官方粉專
};

export const SITE_NAME = 'May4s 伊原力科技';
export const SITE_TAGLINE = '企業 Agentic OS';
export const SITE_DESCRIPTION =
  'May4s 伊原力科技：以 Salesforce、Slack 與 Agentforce，打造企業的 Agentic OS——讓人與 AI 代理人在同一個工作空間協作。';
