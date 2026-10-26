import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Send, 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  CheckCircle,
  Copy,
  Check,
  MessageSquare,
  HelpCircle,
  PhoneCall,
  ExternalLink
} from 'lucide-react';
import { LEAD_STATUSES } from '../data/leadsData';

export default function LeadDrawer({ lead, onClose, onStatusChange, onSaveNote }) {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState(lead?.notes || '');
  const [savedNote, setSavedNote] = useState(false);

  if (!lead) return null;

  const handleCopyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveNote = () => {
    onSaveNote(lead.id, note);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* Drawer Container */}
      <div className="drawer slide-in-right">
        {/* Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid var(--border-subtle)', 
          background: '#ffffff',
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-verified">
                <ShieldCheck size={12} /> 100% Прямой заказчик
              </span>
              <span className="badge badge-score">
                Match: {lead.score}%
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              {lead.company}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {lead.industry} • {lead.source}
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ 
              background: '#f1f5f9', 
              border: 'none', 
              color: '#64748b', 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer' 
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Actions (Call & TG) */}
          <div style={{ 
            background: 'linear-gradient(135deg, #f0fdf4, #faf5ff)', 
            border: '1px solid #bbf7d0', 
            borderRadius: '16px', 
            padding: '18px' 
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#166534', marginBottom: '10px', letterSpacing: '0.05em' }}>
              Быстрая связь с ЛПР
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {lead.phone && (
                <a 
                  href={`tel:${lead.phone}`} 
                  className="btn btn-call-emerald" 
                  style={{ flex: 1, minWidth: '200px', padding: '10px 16px', fontSize: '13px' }}
                >
                  <Phone size={15} />
                  <span>Позвонить: {lead.phone}</span>
                </a>
              )}

              {lead.telegram && (
                <a 
                  href={`https://t.me/${lead.telegram.replace('@', '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn" 
                  style={{ background: '#0284c7', color: '#fff', padding: '10px 16px', fontSize: '13px' }}
                >
                  <Send size={15} />
                  <span>Написать в TG</span>
                </a>
              )}

              {lead.url && (
                <a 
                  href={lead.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-outline" 
                  style={{ padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Открыть оригинальную страницу заказа"
                >
                  <ExternalLink size={14} />
                  <span>Открыть заказ</span>
                </a>
              )}

              <button 
                onClick={handleCopyPhone} 
                className="btn btn-outline"
                style={{ padding: '10px 14px' }}
                title="Скопировать телефон"
              >
                {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* Contact Details Card */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
              Данные ответственного лица
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ФИО ЛПР:</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{lead.contactName}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Должность:</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{lead.role}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Прямой телефон:</div>
                <div style={{ color: '#059669', fontWeight: 700, marginTop: '2px' }}>{lead.phone || 'Не указан'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Telegram профиль:</div>
                <div style={{ color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>{lead.telegram || '—'}</div>
              </div>
            </div>
          </div>

          {/* The Request Quote */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Исходный запрос клиента
              </div>
              <span className="badge" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                {lead.service}
              </span>
            </div>
            <div style={{ 
              background: '#f8fafc', 
              padding: '14px', 
              borderRadius: '10px', 
              borderLeft: '3px solid var(--primary)',
              fontSize: '13px', 
              lineHeight: '1.6',
              color: '#1e293b',
              fontStyle: 'italic'
            }}>
              "{lead.requestText}"
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Ориентировочный бюджет: <strong style={{ color: '#059669', fontSize: '13px' }}>{lead.budget}</strong></span>
              <span>Сигнал зафиксирован: {lead.date}</span>
            </div>
          </div>

          {/* Recommended Solution for Studio */}
          <div style={{ background: '#faf5ff', border: '1px solid #ddd6fe', borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7c3aed', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              <Sparkles size={14} />
              <span>Рекомендуемое предложение студии</span>
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#334155' }}>
              {lead.suggestedSolution}
            </div>
          </div>

          {/* Call Script & Icebreaker */}
          <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0891b2', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              <MessageSquare size={14} />
              <span>Готовый скрипт для созвона с ЛПР</span>
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#164e63' }}>
              «Добрый день, {lead.contactName}! Меня зовут [Имя], студия графики. Увидели ваш запрос на {lead.service} для {lead.company}. Мы специализируемся именно на сфере «{lead.industry}» и недавно делали подобную визуализацию/3D-интерактив. Готовы показать релевантный кейс и подготовить смету за 24 часа. Удобно ли сейчас уделить 2 минуты?»
            </div>
          </div>

          {/* Manager Notes */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
              Заметки менеджера по созвону
            </div>
            <textarea
              rows={3}
              placeholder="Результат созвона, договоренности, дата повторного контакта..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={handleSaveNote} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>
                {savedNote ? 'Сохранено!' : 'Сохранить заметку'}
              </button>
            </div>
          </div>

          {/* Status Changer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Статус лида:</span>
            <select
              value={lead.status || 'new'}
              onChange={(e) => onStatusChange(lead.id, e.target.value)}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {LEAD_STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

        </div>
      </div>
    </>
  );
}
