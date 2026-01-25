import { type Component } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import Layout from './components/Layout';


import DailyDashboard from './pages/DailyDashboard';
import AnnualView from './pages/AnnualView';
import MonthlyView from './pages/MonthlyView';
import WeeklyView from './pages/WeeklyView';
import Habits from './pages/Habits';
import Login from './pages/Login';

const App: Component = () => {

  return (
    <Router>
      <Route path="/login" component={Login} />
      <Route path="/" component={Layout}>
        <Route path="/" component={DailyDashboard} />
        <Route path="/habits" component={Habits} />
        <Route path="/planning/annual" component={AnnualView} />
        <Route path="/planning/monthly" component={MonthlyView} />
        <Route path="/planning/weekly" component={WeeklyView} />
      </Route>
    </Router>
  );
};

export default App;
