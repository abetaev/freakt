import React, { ReactNode } from 'react';

export type ContinuationChildren<T> = (value: T) => ReactNode

export interface ContinuationProps<T> {
  children: ContinuationChildren<T>
}

type Observer<T> = (value: T) => void

export interface State<T> {
  Fragment: React.ElementType<ContinuationProps<T>>
  set: (value: T | Promise<T>) => Promise<void>
  update: () => void
  listen: (observer: Observer<T>) => void
  value: () => T
  explode: () => { [K in keyof T]: State<T[K]> }
}

type VersionState = { version: number }

export function define<T>(initialValue?: T | Promise<T>): State<T> {

  let initialized = false
  let version: number = 0
  let value: T

  const components: React.Component<ContinuationProps<T>, VersionState>[] = []
  const listeners: Observer<T>[] = []

  const state: State<T> = {
    value: () => value,
    Fragment: class extends React.Component<ContinuationProps<T>, VersionState> {
      constructor(props: ContinuationProps<T>) { super(props); }
      componentDidMount = () => { this.setState({ version }); components.push(this) }
      componentWillUnmount = () => components.splice(components.indexOf(this), 1)
      render = () => initialized && this.props.children(value) || null
    },
    set: async (newValue: T | Promise<T>) => {
      value = await newValue
      initialized = true
      version++
      state.update()
    },
    update: () => {
      components.forEach(component => component.setState({ version }))
      listeners.forEach(observe => observe(value))
    },
    listen: (observer: Observer<T>) => listeners.push(observer),
    explode: () => explode(state)
  }

  state.set(initialValue)

  return state

}

type CompositeState<T> = { [K in keyof T]: State<T[K]> }

export function compose<T>(composedStates: CompositeState<T>): State<T> {

  const compositeValue: T = Object.assign({}) // to avoid TS type complaint

  const state = define()
  const observers: Observer<T>[] = []

  Object.keys(composedStates)
    .forEach(key => composedStates[key].listen(
      (value: any) => {
        compositeValue[key] = value
        observers.forEach(observe => observe(compositeValue))
        state.update()
      }
    ))


  const compositeState = {
    Fragment: ({ children }: ContinuationProps<T>) => (
      <state.Fragment>
        {() => children(compositeValue)}
      </state.Fragment>
    ),
    set: async (value: T | Promise<T>) => {
      Object.assign(compositeValue, await value)
      Object.keys(compositeValue)
        .forEach(key => composedStates[key].set(compositeValue[key]))
      state.update()
    },
    update: () => state.update(),
    listen: (observer: Observer<T>) => observers.push(observer),
    value: () => compositeValue,
    explode: () => composedStates
  }

  return compositeState
}

type ExplodedState<T> = { [K in keyof T]: State<T[K]> }

function explode<T>(state: State<T>): ExplodedState<T> {
  return new Proxy<State<T>>(
    state,
    { get: (__, key: keyof T) => extract(state, key) }
  ) as unknown as ExplodedState<T>
}

function extract<S, K extends keyof S = keyof S>(state: State<S>, key: K): State<S[K]> {
  const extractedState = {
    Fragment: ({ children }) => (
      <state.Fragment>
        {value => children(value[key])}
      </state.Fragment>
    ),
    set: async (value: S[K] | Promise<S[K]>) => {
      const tmp: any = {}
      tmp[key] = await value
      return state.set(Object.assign(state.value() || {}, tmp))
    },
    update: () => state.update(),
    listen: listener => state.listen(value => listener(value[key])),
    value: () => state.value() && (state.value()[key]),
    explode: () => explode(extractedState)
  }

  return extractedState
}