import { createStore, action } from 'easy-peasy';

const store = createStore({
  selectedProjectId: null,
  setSelectedProjectId: action((state, payload) => {
    state.selectedProjectId = payload;
  }),
  projects: [],
  setProjects: action((state, payload) => {
    state.projects = payload;
  }),
});

export default store;
