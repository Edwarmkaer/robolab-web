/** Lista de retos del tópico y nivel de un reto: adónde vuelve "Volver a la lista" y la flecha del celular. */
export const listPath = (challenge: { readonly topic: string; readonly level: string }): string => `/explorar/${challenge.topic}/${challenge.level}`;
