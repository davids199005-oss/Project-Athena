/**
 * @module app/core/models/pagination.model
 *
 * **Purpose:** Generic wrapper for list endpoints that return `data` + `meta` pagination blocks.
 *
 * **Responsibilities:** Constrain table components and services to a consistent pagination shape.
 *
 * **Integration notes:** `meta.page` is usually 1-based in this app—verify when mapping PrimeNG lazy events.
 */
export interface IPaginatedResponse<T> {
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }