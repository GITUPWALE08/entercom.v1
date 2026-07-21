import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../axios';
import MockAdapter from 'axios-mock-adapter';

describe('axios error handler', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('handles null response data gracefully without crashing', async () => {
    mock.onGet('/test-null').reply(400, null);

    await expect(apiClient.get('/test-null')).rejects.toThrow();
    
    try {
      await apiClient.get('/test-null');
    } catch (error: any) {
      expect(error.message).toBe('Request failed with status code 400');
    }
  });

  it('handles empty object gracefully', async () => {
    mock.onGet('/test-empty').reply(400, {});

    try {
      await apiClient.get('/test-empty');
    } catch (error: any) {
      expect(error.message).toBe('Request failed with status code 400');
    }
  });

  it('extracts nested errors correctly', async () => {
    mock.onGet('/test-errors').reply(400, {
      errors: {
        field1: ['Error 1'],
        field2: 'Error 2'
      }
    });

    try {
      await apiClient.get('/test-errors');
    } catch (error: any) {
      expect(error.message).toBe('field1: Error 1 | field2: Error 2');
    }
  });

  it('extracts message correctly', async () => {
    mock.onGet('/test-msg').reply(400, {
      message: 'A custom error message'
    });

    try {
      await apiClient.get('/test-msg');
    } catch (error: any) {
      expect(error.message).toBe('A custom error message');
    }
  });
});
