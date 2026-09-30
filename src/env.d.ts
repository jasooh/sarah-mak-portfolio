declare global {
  interface Window {
    /** Guards the backdrop against a second start after a view transition. */
    __backdrop?: boolean;
    /** Guards the route listener in BaseLayout against being bound twice. */
    __routeBound?: boolean;
  }
}

export {};
