/**
 * Traduce los errores de Supabase a mensajes en español que una persona
 * entienda. Nadie más monta un mensaje de error de la frontera o de
 * autenticación a mano: pasa por aquí.
 */
import type { AuthError, PostgrestError } from '@supabase/supabase-js';

export type CodigoErrorFrontera = 'no_autorizado' | 'no_existe' | 'invalido' | 'conflicto' | 'desconocido';

export interface ErrorFrontera {
  codigo: CodigoErrorFrontera;
  mensaje: string;
}

/**
 * Los cuatro códigos de la frontera de escritura, fijados en
 * supabase/migrations/20260916064331_movimientos_y_frontera_de_escritura.sql:
 * 42501 no autorizado, P0002 no existe en este hogar, 22023 parámetro
 * inválido, PT409 conflicto de versión (u otro móvil ganó la misma clave de
 * idempotencia). El mensaje lo escribimos aquí y no se reenvía el de
 * Postgres, salvo en 22023: ahí la propia función ya explica en español qué
 * dato falla (importe, fecha o categoría), y es más útil que uno genérico.
 */
export function traducirErrorFrontera(error: PostgrestError): ErrorFrontera {
  switch (error.code) {
    case '42501':
      return { codigo: 'no_autorizado', mensaje: 'No tienes permiso para hacer esto.' };
    case 'P0002':
      return { codigo: 'no_existe', mensaje: 'Ese movimiento ya no existe en este hogar.' };
    case '22023':
      return { codigo: 'invalido', mensaje: error.message || 'Ese dato no es válido.' };
    case 'PT409':
      return {
        codigo: 'conflicto',
        mensaje: 'Esto cambió en otro móvil. Recarga la pantalla e inténtalo de nuevo.',
      };
    default:
      return { codigo: 'desconocido', mensaje: 'No se ha podido completar la operación. Inténtalo de nuevo.' };
  }
}

/** Los casos de autenticación con los que se puede topar /entrar. El resto, un mensaje genérico. */
export function traducirErrorAuth(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Ya existe una cuenta con ese correo. Entra en vez de crear una nueva.';
    case 'weak_password':
      return 'La contraseña es demasiado corta o débil.';
    case 'email_not_confirmed':
      return 'Tienes que confirmar tu correo antes de entrar. Revisa la bandeja de entrada.';
    case 'email_address_invalid':
      return 'Ese correo no es válido.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.';
    case 'signup_disabled':
      return 'El registro no está disponible ahora mismo.';
    default:
      return 'No se ha podido completar la operación. Inténtalo de nuevo.';
  }
}
