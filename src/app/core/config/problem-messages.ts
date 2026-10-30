export const TOAST = {
  forbidden: 'Action non autorisée',
  unavailable: 'Service momentanément indisponible, réessayez',
  generic: 'Une erreur est survenue. Réessayez dans un instant.',
  expired: 'Votre session a expiré. Reconnectez-vous.',
  offline: 'Impossible de joindre le serveur.',
  fallback: 'La requête n’a pas pu aboutir.',
} as const;

export const PROBLEM_MESSAGES: Readonly<Record<string, string>> = {
  VALIDATION_ERROR: 'Certaines informations saisies sont invalides.',
  MALFORMED_REQUEST: 'La requête est illisible.',
  INVALID_AMOUNT: 'Le montant est invalide.',
  ACCOUNT_NOT_FOUND: 'Compte introuvable.',
  CUSTOMER_NOT_FOUND: 'Client introuvable.',
  DUPLICATE_PHONE: 'Ce numéro de téléphone est déjà utilisé.',
  ACCOUNT_NOT_EMPTY: 'Le solde doit être à 0,00 CDF pour clôturer le compte.',
  INVALID_STATE_TRANSITION: 'Cette action n’est pas possible dans l’état actuel.',
  CUSTOMER_SUSPENDED: 'Ce client est suspendu : aucun nouveau compte ne peut être ouvert.',
  CONCURRENT_UPDATE: 'Un autre traitement est en cours. Réessayez.',
  UNAUTHENTICATED: 'Authentification requise.',
  FORBIDDEN: TOAST.forbidden,
  INVALID_ACCOUNT_NUMBER: 'Le numéro de compte est invalide.',
  OPERATION_NOT_FOUND: 'Opération introuvable.',
  IDEMPOTENCY_CONFLICT: 'Cette référence a déjà été utilisée.',
  DUPLICATE_USERNAME: 'Ce nom d’utilisateur est déjà utilisé.',
  INTERNAL_ERROR: TOAST.generic,
};

export function messageFor(status: number, code: string | null): string {
  if (status === 401) {
    return TOAST.expired;
  }
  if (status === 403) {
    return TOAST.forbidden;
  }
  if (status === 503) {
    return TOAST.unavailable;
  }
  if (status >= 500) {
    return TOAST.generic;
  }
  if (status === 0) {
    return TOAST.offline;
  }
  if (code) {
    const known = PROBLEM_MESSAGES[code];
    if (known) {
      return known;
    }
  }
  if (status === 404) {
    return 'Élément introuvable.';
  }
  return TOAST.fallback;
}
