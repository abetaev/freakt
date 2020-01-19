import React, { ReactNode } from 'react';

export type ContinuationChildren<T> = (value: T) => ReactNode

export interface ContinuationProps<T> {
  children: ContinuationChildren<T>
}

type Observer<T> = (value: T) => Promise<void>
type Writer<T> = (value: T) => Promise<T>
type ExplodedState<T> = { [K in keyof T]: State<T[K]> }

export interface State<T> {
  Fragment: React.ElementType<ContinuationProps<T>>
  set: (value: T | Promise<T>) => Promise<void>
  update: () => void
  reset: () => Promise<void>
  listen: (observer: Observer<T>) => void
  value: () => T
  explode: () => ExplodedState<T>
}

type VersionState = { version: number }

type Value<T> = T | Promise<T>
type ValueProvider<T> = (current?: T) => Value<T>

export function define<T>(initial?: Value<T> | ValueProvider<T>, persist?: Writer<T>): State<T> {

  let initialized = false
  let version: number = 0
  let value: T | undefined = undefined

  const components: React.Component<ContinuationProps<T>, VersionState>[] = []
  const listeners: Observer<T>[] = []

  const init: ValueProvider<T> | undefined =
    typeof initial === 'function' ? (initial as ValueProvider<T>) : undefined

  const state: State<T> = {
    value: () => value,
    Fragment: class extends React.Component<ContinuationProps<T>, VersionState> {
      constructor(props: ContinuationProps<T>) { super(props); }
      componentDidMount = () => { this.setState({ version }); components.push(this) }
      componentWillUnmount = () => components.splice(components.indexOf(this), 1)
      render() {
        try {
          return initialized ? this.props.children(value) : null
        } catch {
          state.reset()
          return null
        }
      }
    },
    set: async (newValue: T | Promise<T>) => {
      value = persist ? await persist(await newValue) : (await newValue)
      version++
      initialized = true
      state.update()
    },
    reset: async () => init ? state.set(init()) : undefined,
    update: () => {
      components.forEach(component => component.setState({ version }))
      listeners.forEach(observe => observe(value))
    },
    listen: (observer: Observer<T>) => listeners.push(observer),
    explode: () => explode(state)
  }

  state.set(init ? init(undefined) : (initial as Value<T>))

  return state

}

type CompositeState<T> = { [K in keyof T]: State<T[K]> }

export function compose<T>(composedStates: CompositeState<T>): State<T> {

  const compositeValue: T = Object.assign({}) // to avoid TS type complaint

  async function reset() {
    Object.values(composedStates).forEach((state: State<any>) => state.reset())
  }

  const state = define(() => reset())
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
    reset,
    update: () => state.update(),
    listen: (observer: Observer<T>) => observers.push(observer),
    value: () => compositeValue,
    explode: () => composedStates
  }

  return compositeState
}

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
    reset: () => state.reset(),
    update: () => state.update(),
    listen: (listener: Observer<S[K]>) => state.listen(value => listener(value[key])),
    value: () => state.value() && (state.value()[key]),
    explode: () => explode(extractedState)
  }

  return extractedState
}