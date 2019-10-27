import React, { Fragment, ReactNode } from 'react';
import { render } from 'react-dom';
import * as state from './state';
import * as when from './when';
import { WithFallback } from './lang';
const say = state.define("hello")
const name = state.define("world")

const composite = state.compose({ say, name })

const ErrorFragment = (error: Error) => (
  <Fragment>
    <h1>{error.name}</h1>
    <p>{error.message}</p>
  </Fragment>
)

const ThrowFragment = () => {
  throw new Error("this is test exception")
  return <div>i will never show this</div>
}

render(
  (
    <Fragment>
      <WithFallback fallback={ErrorFragment}>
        <say.Fragment>
          {value => `say: ${value}`}
        </say.Fragment>
        <composite.Fragment>
          {value => when.defined(value, (
            <div>{JSON.stringify(value)}</div>
          ))}
        </composite.Fragment>
        <button onClick={() => say.set("hello")}>say</button>
        <button onClick={() => name.set("world")}>name</button>
        <button onClick={() => composite.set({ say: "goodbye", name: "yesterday" })}>composite</button>
      </WithFallback>
      <WithFallback fallback={ErrorFragment}>
        <ThrowFragment />
      </WithFallback>
    </Fragment>
  ),
  document.getElementById("app")
)
