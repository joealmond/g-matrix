'use client';
import { useEffect, useState, useRef } from 'react';
import {
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  type Query,
  type DocumentData,
  type CollectionReference,
  type QuerySnapshot,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

type Options = {
  listen: boolean;
};

const defaultOptions: Options = {
  listen: true,
};

export function useCollection<T>(
  ref: Query | CollectionReference | null,
  options: Options = defaultOptions
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    if (optionsRef.current.listen) {
      const unsubscribe = onSnapshot(
        ref as Query,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const docs = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as T)
          );
          setData(docs);
          setLoading(false);
          setError(null);
        },
        (err) => {
          const permissionError = new FirestorePermissionError({
            path: (ref as CollectionReference).path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          setError(permissionError);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setLoading(true);
      getDocs(ref as Query)
        .then((snapshot) => {
          const docs = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as T)
          );
          setData(docs);
          setLoading(false);
          setError(null);
        })
        .catch((err) => {
           const permissionError = new FirestorePermissionError({
            path: (ref as CollectionReference).path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          setError(permissionError);
          setLoading(false);
        });
    }
  }, [ref]);

  return { data, loading, error };
}
