import React, { useState } from 'react';
import { 
  X, 
  Phone, 
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
  ExternalLink,
  Send,
  Mail
} from 'lucide-react';
import { LEAD_STATUSES, getLeadGrade } from '../data/leadsData';

export default function LeadDrawer({ lead, onClose, onStatusChange, onSaveNote }) {
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState(lead?.notes || '');
  const [savedNote, setSavedNote] = useState(false);

  if (!lead) return null;

  const grade = lead.grade || getLeadGrade(lead.score || 70) || 'B';
  const contactName = lead.contactName || lead.contact_name || 'Отдел маркетинга / Основатель';
  const role = lead.role || 'ЛПР проекта / CEO';
  const requestText = lead.requestText || lead.request_text || lead.company;
  const suggestedSolution = lead.suggestedSolution || lead.suggested_solution || 'Подготовка коммерческого предложения и релевантного портфолио под задачу проекта.';
  const date = lead.date || (lead.created_at ? lead.created_at.replace('T', ' ').slice(0, 16) : 'Сегодня');

  const handleCopyPhone = () => {
    if (!lead.phone) return;
    navigator.clipboard.writeText(lead.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNote = () => {
    if (onSaveNote) {
      onSaveNote(lead.id, note);
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 2000);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(26, 26, 26, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000
        }}
      />

      {/* Slide-over Drawer (Правая панель 540px) */}
      <div 
        className="lead-drawer drawer slide-in-right" 
        style={{ 
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '540px',
          maxWidth: '92vw',
          background: '#ffffff',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: '-8px 0 36px rgba(0, 0, 0, 0.18)',
          zIndex: 1001,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: 'var(--color-surface-white)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`grade-badge grade-${grade.toLowerCase()}`}>
                {grade}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-headline)', fontFamily: 'var(--font-mono)' }}>
                Match: <strong>{lead.score}%</strong>
              </span>
              <span className="badge badge-verified">
                <ShieldCheck size={12} /> Прямой заказчик
              </span>
            </div>
            
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-black)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {lead.company}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--color-text-headline)', marginTop: '2px' }}>
              Отрасль: <span style={{ color: 'var(--color-text-body)', fontWeight: 500 }}>{lead.industry}</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn-icon"
            style={{ borderRadius: '50%', padding: '6px' }}
            title="Закрыть карточку"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Action Block (Раздел 8.3 ТЗ) */}
          <div style={{
            background: 'var(--color-surface-beige-2)',
            border: '1px solid var(--border-medium)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-headline)', marginBottom: '10px', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              Быстрая связь с ЛПР
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {lead.phone && (
                <a 
                  href={`tel:${lead.phone}`} 
                  className="btn btn-call" 
                  style={{ flex: 1, minWidth: '160px', padding: '9px 16px', fontSize: '13px', borderRadius: '6px', fontFamily: 'var(--font-mono)' }}
                >
                  <Phone size={15} />
                  <span>Позвонить: {lead.phone}</span>
                </a>
              )}

              {lead.telegram && (
                <a 
                  href={lead.telegram.startsWith('http') ? lead.telegram : `https://t.me/${lead.telegram.replace('@', '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn" 
                  style={{ 
                    padding: '9px 14px', 
                    fontSize: '13px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    borderRadius: '6px',
                    background: '#229ED9',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600
                  }}
                  title="Написать в Telegram"
                >
                  <Send size={14} />
                  <span>Telegram</span>
                </a>
              )}

              {lead.email && (
                <a 
                  href={`mailto:${lead.email}`} 
                  className="btn btn-outline" 
                  style={{ padding: '9px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px' }}
                  title={`Написать на почту: ${lead.email}`}
                >
                  <Mail size={14} />
                  <span>Email</span>
                </a>
              )}

              {lead.url && (
                <a 
                  href={lead.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-outline" 
                  style={{ padding: '9px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px' }}
                  title="Открыть сайт компании / оригинальную страницу"
                >
                  <ExternalLink size={14} />
                  <span>Сайт компании</span>
                </a>
              )}

              <button 
                onClick={handleCopyPhone} 
                className="btn btn-outline"
                style={{ padding: '9px 14px', borderRadius: '6px' }}
                title="Скопировать телефон"
              >
                {copied ? <Check size={15} color="var(--color-accent-purple)" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* Contact Details Card */}
          <div style={{ background: 'var(--color-surface-white)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-headline)', marginBottom: '12px', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              Данные ответственного лица
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ color: 'var(--color-text-headline)', fontSize: '11px' }}>ФИО ЛПР:</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text-black)', marginTop: '2px' }}>{contactName}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-headline)', fontSize: '11px' }}>Должность:</div>
                <div style={{ color: 'var(--color-text-body)', marginTop: '2px' }}>{role}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-headline)', fontSize: '11px' }}>Прямой телефон:</div>
                <div style={{ color: 'var(--color-text-black)', fontWeight: 700, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{lead.phone || 'В поиске'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-headline)', fontSize: '11px' }}>Telegram / Почта:</div>
                <div style={{ color: 'var(--color-accent-purple)', fontWeight: 600, marginTop: '2px', fontSize: '12px', wordBreak: 'break-all' }}>
                  {lead.telegram ? lead.telegram.replace('https://t.me/', '@') : (lead.email || '—')}
                </div>
              </div>
            </div>
          </div>

          {/* The Request Quote */}
          <div style={{ background: 'var(--color-surface-white)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-headline)', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
                Исходный запрос клиента
              </div>
              <span className="badge" style={{ background: '#e0e1f7', color: 'var(--color-accent-purple)', border: '1px solid var(--color-accent-lavender)' }}>
                {lead.service}
              </span>
            </div>
            <div style={{ 
              background: 'var(--color-surface-beige-1)', 
              padding: '12px', 
              borderRadius: '8px', 
              borderLeft: '3px solid var(--color-accent-purple)',
              fontSize: '13px', 
              lineHeight: '1.6',
              color: 'var(--color-text-black)',
              fontStyle: 'italic'
            }}>
              "{requestText}"
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px', color: 'var(--color-text-headline)', flexWrap: 'wrap', gap: '8px' }}>
              <span>Ориентировочный бюджет: <strong style={{ color: 'var(--color-text-black)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{lead.budget}</strong></span>
              {lead.url && (
                <a 
                  href={lead.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ 
                    color: 'var(--color-accent-purple)', 
                    fontWeight: 600, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                  title="Перейти на сайт / первоисточник компании"
                >
                  <ExternalLink size={12} />
                  <span>{lead.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </a>
              )}
              <span style={{ fontFamily: 'var(--font-mono)' }}>Сигнал: {date}</span>
            </div>
          </div>

          {/* Recommended Solution for Studio */}
          <div style={{ background: 'var(--color-surface-beige-1)', border: '1px solid var(--color-accent-lavender)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent-purple)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              <Sparkles size={14} />
              <span>Рекомендуемое предложение студии</span>
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--color-text-body)' }}>
              {suggestedSolution}
            </div>
          </div>

          {/* Call Script & Icebreaker */}
          <div style={{ background: 'var(--color-surface-beige-2)', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-black)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              <MessageSquare size={14} />
              <span>Готовый скрипт для созвона с ЛПР</span>
            </div>
            <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--color-text-body)' }}>
              «Добрый день, {contactName}! Меня зовут [Имя], студия графики. Увидели ваш запрос на {lead.service} для {lead.company}. Мы специализируемся именно на сфере «{lead.industry}» и недавно делали подобную визуализацию/3D-интерактив. Готовы показать релевантный кейс и подготовить смету за 24 часа. Удобно ли сейчас уделить 2 минуты?»
            </div>
          </div>

          {/* Manager Notes */}
          <div style={{ background: 'var(--color-surface-white)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-headline)', marginBottom: '8px', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
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
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                background: 'var(--color-surface-beige-1)',
                color: 'var(--color-text-black)'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={handleSaveNote} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '4px' }}>
                {savedNote ? 'Сохранено!' : 'Сохранить заметку'}
              </button>
            </div>
          </div>

          {/* Status Changer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--color-surface-beige-2)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-black)' }}>Статус лида:</span>
            <select
              value={lead.status || 'new'}
              onChange={(e) => onStatusChange(lead.id, e.target.value)}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-medium)',
                background: 'var(--color-surface-white)',
                color: 'var(--color-text-black)',
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
