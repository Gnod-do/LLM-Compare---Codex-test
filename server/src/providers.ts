const PROVIDERS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  deepseek: 'DeepSeek',
  moonshotai: 'Moonshot AI',
  spacexai: 'xAI',
};

export function providerFromId(id: string): string {
  const prefix = id.split('/')[0];
  return PROVIDERS[prefix] ?? prefix;
}
