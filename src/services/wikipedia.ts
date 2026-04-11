/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WikipediaArticle {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls: {
    desktop: {
      page: string;
    };
  };
}

export async function fetchWikipediaSummary(title: string, lang: 'be' | 'ru' = 'ru'): Promise<WikipediaArticle | null> {
  const wikiLang = lang === 'be' ? 'be' : 'ru';
  const url = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data as WikipediaArticle;
  } catch (error) {
    console.error(`Failed to fetch Wikipedia summary for ${title}:`, error);
    return null;
  }
}

export const CYBERSECURITY_TOPICS = [
  { be: 'Фішынг', ru: 'Фишинг' },
  { be: 'Сацыяльная інжынерыя', ru: 'Социальная инженерия' },
  { be: 'Кампутарны вірус', ru: 'Компьютерный вирус' },
  { be: 'Шматаўтарская аўтэнтыфікацыя', ru: 'Многофакторная аутентификация' },
  { be: 'Крыптаграфія', ru: 'Криптография' },
  { be: 'Кіберзлачыннасць', ru: 'Киберпреступность' },
  { be: 'Інфармацыйная бяспека', ru: 'Информационная безопасность' },
  { be: 'Дыпфейк', ru: 'Дипфейк' },
];
