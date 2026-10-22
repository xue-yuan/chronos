import { type Component, lazy } from 'solid-js';
import { Router, Route, Navigate } from '@solidjs/router';
import Layout from './components/Layout';

import DayView from './pages/DayView';
import Login from './pages/Login';

const WeekView = lazy(() => import('./pages/WeekView'));
const MonthView = lazy(() => import('./pages/MonthView'));
const YearView = lazy(() => import('./pages/YearView'));
const Habits = lazy(() => import('./pages/Habits'));

const App: Component = () => {

  return (
    <Router>
      <Route path="/login" component={Login} />
      <Route path="/" component={Layout}>
        <Route path="/" component={DayView} />
        <Route path="/day/:date" component={DayView} />
        <Route path="/week/:week?" component={WeekView} />
        <Route path="/month/:month?" component={MonthView} />
        <Route path="/year/:year?" component={YearView} />
        <Route path="/habits" component={Habits} />
        <Route path="/planning/weekly" component={() => <Navigate href="/week" />} />
        <Route path="/planning/monthly" component={() => <Navigate href="/month" />} />
        <Route path="/planning/annual" component={() => <Navigate href="/year" />} />
        <Route path="*" component={() => <Navigate href="/" />} />
      </Route>
    </Router>
  );
};

export default App;
