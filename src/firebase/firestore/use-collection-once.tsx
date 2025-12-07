'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  getDocs,
  DocumentData,
  FirestoreError,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionOnceResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
  refetch: () => void;
}

export function useCollectionOnce<T = any>(
  targetRefOrQuery: CollectionReference<DocumentData> | Query<DocumentData> | null | undefined
): UseCollectionOnceResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!targetRefOrQuery) {
      setIsLoading(false);
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    getDocs(targetRefOrQuery)
      .then((snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as WithId<T>[];
        setData(docs);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Firestore getDocs error:', err);
        setError(err);
        setIsLoading(false);
        
        if (err.code === 'permission-denied') {
            errorEmitter.emit('error', new FirestorePermissionError('Permission denied'));
        }
      });
  }, [targetRefOrQuery, trigger]);

  const refetch = () => setTrigger(prev => prev + 1);

  return { data, isLoading, error, refetch };
}
