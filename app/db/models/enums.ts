import { pgEnum } from 'drizzle-orm/pg-core';

export enum UserRole {
  PLATFORM_ADMIN = 'platform_admin',
  PROVIDER = 'provider',
  PATIENT = 'patient',
}

export const userRole = pgEnum('user_role', [
  UserRole.PLATFORM_ADMIN,
  UserRole.PROVIDER,
  UserRole.PATIENT,
]);

export enum ProviderRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  OTHER = 'other',
}

export const providerRole = pgEnum('provider_role', [
  ProviderRole.ADMIN,
  ProviderRole.DOCTOR,
  ProviderRole.NURSE,
  ProviderRole.OTHER,
]);

export enum IdentificationType {
  // CC = Cedula de Ciudadania
  CC = 'CC',
  // TI = Tarjeta de Identidad
  TI = 'TI',
  // CE = Cedula de Extranjeria
  CE = 'CE',
  // PA = Pasaporte
  PA = 'PA',
}

export const identificationType = pgEnum('identification_type', [
  IdentificationType.CC,
  IdentificationType.TI,
  IdentificationType.CE,
  IdentificationType.PA,
]);

export enum Sex {
  MALE = 'male',
  FEMALE = 'female',
  INTERSEX = 'intersex',
  UNKNOWN = 'unknown',
}

export const sex = pgEnum('sex', [Sex.MALE, Sex.FEMALE, Sex.INTERSEX, Sex.UNKNOWN]);

export enum AuditAction {
  VIEW = 'view',
  LIST = 'list',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  LOGIN = 'login',
  LOGIN_FAILED = 'login_failed',
}

export const auditAction = pgEnum('audit_action', [
  AuditAction.VIEW,
  AuditAction.LIST,
  AuditAction.CREATE,
  AuditAction.UPDATE,
  AuditAction.DELETE,
  AuditAction.EXPORT,
  AuditAction.LOGIN,
  AuditAction.LOGIN_FAILED,
]);
