import { createStore, action } from 'easy-peasy';

const store = createStore({
  selectedProjectId: localStorage.getItem("selectedProjectId"),
  setSelectedProjectId: action((state, payload) => {
    state.selectedProjectId = payload;
  }),
  projects: [],
  setProjects: action((state, payload) => {
    state.projects = payload;
  }),
});

export default store;
