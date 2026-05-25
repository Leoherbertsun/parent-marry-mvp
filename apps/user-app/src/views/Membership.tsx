import { useState } from "react";
import { Check, Crown, X } from "lucide-react";
import { motion } from "framer-motion";
import { MEMBERSHIP_TIERS, VIP_BENEFITS } from "../lib";

export function Membership({
  vip,
  onClose,
  onSubscribe,
}: {
  vip: boolean;
  onClose: () => void;
  onSubscribe: (tierId: string) => void;
}) {
  const [selected, setSelected] = useState(MEMBERSHIP_TIERS.find((tier) => tier.best)?.id || MEMBERSHIP_TIERS[0].id);
  const tier = MEMBERSHIP_TIERS.find((item) => item.id === selected) || MEMBERSHIP_TIERS[0];

  return (
    <motion.div
      className="sheet-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="vip-sheet"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="sheet-close" onClick={onClose} aria-label="关闭"><X size={20} /></button>

        <div className="vip-hero">
          <span className="vip-hero-ico"><Crown size={26} /></span>
          <strong>牵线会员</strong>
          <small>{vip ? "您的会员正在生效，感谢支持" : "解锁更多合适的缘分，帮孩子少走弯路"}</small>
        </div>

        <div className="vip-benefits">
          {VIP_BENEFITS.map((benefit) => (
            <div key={benefit.title} className="vip-benefit">
              <span className="vip-check"><Check size={13} /></span>
              <div>
                <strong>{benefit.title}</strong>
                <small>{benefit.desc}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="tier-row">
          {MEMBERSHIP_TIERS.map((item) => (
            <button
              key={item.id}
              className={item.id === selected ? "tier-card on" : "tier-card"}
              onClick={() => setSelected(item.id)}
            >
              {item.tag && <span className="tier-tag">{item.tag}</span>}
              <span className="tier-name">{item.name}</span>
              <span className="tier-price"><i>¥</i>{item.price}</span>
              <span className="tier-per">{item.per}</span>
            </button>
          ))}
        </div>

        <button className="primary-button full vip-subscribe" onClick={() => onSubscribe(tier.id)}>
          {vip ? "续费" : "立即开通"} {tier.name} · ¥{tier.price}
        </button>
        <p className="vip-fine">开通即同意《会员服务协议》，到期自动失效（演示原型，不会真实扣费）</p>
      </motion.div>
    </motion.div>
  );
}
