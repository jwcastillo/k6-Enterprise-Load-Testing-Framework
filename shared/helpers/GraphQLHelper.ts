/**
 * GraphQLHelper - GraphQL Testing Utility
 * Simplifies GraphQL queries, mutations, and schema introspection
 */

import { RequestHelper } from './RequestHelper';
import { RefinedResponse } from 'k6/http';

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, any>;
  }>;
}

export class GraphQLHelper {
  private requestHelper: RequestHelper;
  private endpoint: string;

  constructor(baseUrl: string, endpoint: string = '/graphql') {
    this.requestHelper = new RequestHelper(baseUrl);
    this.endpoint = endpoint;
  }

  /**
   * Execute a GraphQL query
   */
  public query<T = any>(query: string, variables?: Record<string, any>, operationName?: string): RefinedResponse<any> {
    const payload: GraphQLRequest = {
      query,
      ...(variables && { variables }),
      ...(operationName && { operationName })
    };

    return this.requestHelper.post(this.endpoint, payload);
  }

  /**
   * Execute a GraphQL mutation
   */
  public mutate<T = any>(mutation: string, variables?: Record<string, any>, operationName?: string): RefinedResponse<any> {
    return this.query<T>(mutation, variables, operationName);
  }

  /**
   * Parse GraphQL response
   */
  public static parseResponse<T = any>(response: RefinedResponse<any>): GraphQLResponse<T> {
    try {
      return JSON.parse(response.body as string) as GraphQLResponse<T>;
    } catch (error) {
      throw new Error(`Failed to parse GraphQL response: ${error}`);
    }
  }

  /**
   * Check if response has errors
   */
  public static hasErrors(response: GraphQLResponse): boolean {
    return !!(response.errors && response.errors.length > 0);
  }

  /**
   * Get error messages from response
   */
  public static getErrorMessages(response: GraphQLResponse): string[] {
    if (!response.errors) return [];
    return response.errors.map(err => err.message);
  }

  /**
   * Introspect GraphQL schema
   */
  public introspectSchema(): RefinedResponse<any> {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            ...FullType
          }
          directives {
            name
            description
            locations
            args {
              ...InputValue
            }
          }
        }
      }

      fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            ...InputValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          ...InputValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }

      fragment InputValue on __InputValue {
        name
        description
        type { ...TypeRef }
        defaultValue
      }

      fragment TypeRef on __Type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    return this.query(introspectionQuery);
  }

  /**
   * Set authentication token
   */
  public setAuth(token: string, type: 'Bearer' | 'Token' = 'Bearer'): void {
    this.requestHelper.setAuth(token, type);
  }

  /**
   * Set custom header
   */
  public setHeader(key: string, value: string): void {
    this.requestHelper.setHeader(key, value);
  }
}
