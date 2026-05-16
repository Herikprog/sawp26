// ============================================================
// SWAP26 — Tipos TypeScript Centralizados
// ============================================================

export type Plan = "free" | "premium";

export interface Profile {
  id: string;
  nome: string;
  username: string;
  avatar_url: string | null;
  cidade: string | null;
  bairro: string | null;
  descricao: string | null;
  reputacao: number;
  total_trocas: number;
  plano: Plan;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Sticker {
  id: number;
  codigo: string;
  nome: string;
  selecao: string;
  grupo: string;
}

export interface UserSticker {
  id: string;
  user_id: string;
  sticker_id: number;
  quantity: number;
  updated_at: string;
  sticker?: Sticker;
}

export type StickerStatus = "obtained" | "missing" | "duplicate";

export interface StickerWithStatus extends Sticker {
  quantity: number;
  status: StickerStatus;
}

export interface AlbumStats {
  total_stickers: number;
  obtained: number;
  missing: number;
  duplicates: number;
  completion_pct: number;
}

export interface MatchResult {
  user_id: string;
  nome: string;
  avatar_url: string | null;
  bairro: string | null;
  cidade: string | null;
  distancia_km: number;
  stickers_tem: number[];
  stickers_precisa: number[];
  score: number;
  is_premium: boolean;
}

export type TradeStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export interface Trade {
  id: string;
  initiator_id: string;
  receiver_id: string;
  status: TradeStatus;
  offered_stickers: number[];
  wanted_stickers: number[];
  match_score: number | null;
  created_at: string;
  updated_at: string;
  initiator?: Profile;
  receiver?: Profile;
}

export interface Conversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  trade_id: string | null;
  last_message: string | null;
  last_msg_at: string | null;
  created_at: string;
  other_user?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
  repost_id?: string | null;
  created_at: string;
  user?: Profile;
  parent?: Post;
  likes?: { user_id: string }[];
  likes_count?: number;
  user_has_liked?: boolean;
}

export type NotificationType = "match" | "trade" | "message" | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_sub_id: string | null;
  plan: Plan;
  status: string;
  current_period_end: string | null;
  created_at: string;
}

// Map FIFA code → ISO 3166-1 alpha-2 for flag CDN
export const FIFA_TO_ISO: Record<string, string> = {
  FWC: "un", // FIFA World Cup — use UN flag
  MEX: "mx",
  RSA: "za",
  KOR: "kr",
  CZE: "cz",
  CAN: "ca",
  BIH: "ba",
  QAT: "qa",
  SUI: "ch",
  BRA: "br",
  MAR: "ma",
  HAI: "ht",
  SCO: "gb-sct",
  USA: "us",
  PAR: "py",
  AUS: "au",
  TUR: "tr",
  GER: "de",
  CUW: "cw",
  CIV: "ci",
  ECU: "ec",
  NED: "nl",
  JPN: "jp",
  SWE: "se",
  TUN: "tn",
  BEL: "be",
  EGY: "eg",
  IRN: "ir",
  NZL: "nz",
  ESP: "es",
  CPV: "cv",
  KSA: "sa",
  URU: "uy",
  FRA: "fr",
  SEN: "sn",
  IRQ: "iq",
  NOR: "no",
  ARG: "ar",
  ALG: "dz",
  AUT: "at",
  JOR: "jo",
  POR: "pt",
  COD: "cd",
  UZB: "uz",
  COL: "co",
  ENG: "gb-eng",
  CRO: "hr",
  GHA: "gh",
  PAN: "pa",
  CC: "un", // Coca-Cola
};

export function getFlagUrl(codigoOrSelecao: string): string {
  // Extract FIFA prefix (3 letters)
  const prefix = codigoOrSelecao.replace(/[0-9]/g, "").toUpperCase();
  const iso = FIFA_TO_ISO[prefix] ?? "un";
  return `https://flagcdn.com/48x36/${iso}.png`;
}

export type SocialNotificationType = "like" | "reply" | "repost" | "follow";

export interface SocialNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: SocialNotificationType;
  post_id?: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}
