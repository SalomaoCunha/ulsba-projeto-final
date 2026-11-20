// Garante que uma promessa demora pelo menos `minimoMs` a resolver — evita que
// o spinner apareça e desapareça num piscar de olhos quando o pedido é rápido.
export function comAtrasoMinimo<T>(promessa: Promise<T>, minimoMs = 600): Promise<T> {
  const espera = new Promise<void>((resolve) => setTimeout(resolve, minimoMs));
  return Promise.all([promessa, espera]).then(([resultado]) => resultado);
}
