import { BUSINESS } from '../../config/business';

/**
 * DEMO ASSISTANT SCRIPT
 * ---------------------
 * Keyword-matched canned replies. There is no human, no AI model, no live
 * stock system and no ticketing behind the chat. Replies must never claim
 * otherwise: no live stock checks, no "logged tickets", no response-time
 * promises, no invented contact details, no delivery or warranty promises.
 */

export type DemoQuickAction =
  | { label: string; actionType: 'open_quote' }
  | { label: string; actionType: 'open_configurator' }
  | { label: string; actionType: 'contact_sales' }
  | { label: string; actionType: 'search'; query: string };

export interface DemoReply {
  reply: string;
  quickActions?: DemoQuickAction[];
}

export const DEMO_ASSISTANT_NAME = 'SDS Demo Assistant';

export const DEMO_GREETING =
  "Hello! I'm a scripted demo assistant for this prototype website — not a person, and nobody at SDS Techware sees this chat. " +
  'I can point you to the catalogue, the quotation list and contact details.';

export function contactReply(): string {
  return `You can contact SDS Techware at ${BUSINESS.salesEmail.value} or ${BUSINESS.phone.value.display}. This chat is not monitored, so please use those details for anything you need answered.`;
}

export function generateDemoReply(userText: string, ctx: { quoteLineCount: number; hasAttachment: boolean }): DemoReply {
  const text = userText.toLowerCase();

  if (ctx.hasAttachment || /screenshot|attachment|photo|image/.test(text)) {
    return {
      reply:
        'Thanks — the image stays in this browser only. Nobody reviews attachments in this demo chat. For technical help, please email the image to SDS Techware with your device model and serial number.',
      quickActions: [{ label: '📞 Contact details', actionType: 'contact_sales' }],
    };
  }

  if (/stock|availab|in stock/.test(text)) {
    return {
      reply:
        "I can't check live stock. Product pages show the availability recorded in this prototype's sample catalogue; SDS Techware confirms real availability in a formal quotation.",
      quickActions: [
        { label: 'Open quotation list', actionType: 'open_quote' },
        { label: '📞 Contact details', actionType: 'contact_sales' },
      ],
    };
  }

  if (/connect|human|agent|person|staff|someone|call|phone|email|contact/.test(text)) {
    return { reply: contactReply() };
  }

  if (/quote|pricing|price|rfq|bulk|volume|discount/.test(text)) {
    const n = ctx.quoteLineCount;
    return {
      reply: `Add products to your quotation list, then download, print or copy the enquiry and send it to SDS Techware. You currently have ${n} ${n === 1 ? 'line' : 'lines'} in your list. Prices are shown only where published; others are "Price on Request".`,
      quickActions: [{ label: 'Open quotation list', actionType: 'open_quote' }],
    };
  }

  if (/deliver|shipping|lead time|dispatch/.test(text)) {
    return {
      reply: 'Delivery options and lead times are not published in this prototype. SDS Techware confirms them in the formal quotation.',
      quickActions: [{ label: '📞 Contact details', actionType: 'contact_sales' }],
    };
  }

  if (/warrant|guarantee|repair|service/.test(text)) {
    return {
      reply:
        'Warranty terms depend on the product and manufacturer and are confirmed in the formal quotation. The warranty lookup on this site is a demo with sample records only.',
    };
  }

  if (/server|rack|workstation|poweredge|proliant|xeon|configur/.test(text)) {
    return {
      reply:
        'You can describe a server or workstation build with the configuration request tool. It does not check compatibility or price — SDS Techware reviews each request.',
      quickActions: [{ label: 'Open configuration request', actionType: 'open_configurator' }],
    };
  }

  if (/monitor|display|screen/.test(text)) {
    return { reply: 'Here are the monitors in the sample catalogue.', quickActions: [{ label: 'Search monitors', actionType: 'search', query: 'monitor' }] };
  }

  if (/keyboard|mouse|mice/.test(text)) {
    return { reply: 'Here are the keyboards and mice in the sample catalogue.', quickActions: [{ label: 'Search Logitech', actionType: 'search', query: 'Logitech' }] };
  }

  if (/\b(hello|hi|hey|morning|afternoon)\b/.test(text)) {
    return {
      reply: 'Hi! I can help you find products, build a quotation list, or show SDS Techware contact details.',
      quickActions: [
        { label: 'Open quotation list', actionType: 'open_quote' },
        { label: '📞 Contact details', actionType: 'contact_sales' },
      ],
    };
  }

  return {
    reply:
      "I'm a simple scripted demo and may not understand that. Try the catalogue search, or contact SDS Techware directly for a proper answer.",
    quickActions: [
      { label: 'Open quotation list', actionType: 'open_quote' },
      { label: '📞 Contact details', actionType: 'contact_sales' },
    ],
  };
}
