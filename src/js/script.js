// define constant key names to store data with that key names
const LOCAL_STORAGE_CATEGORY_KEY = "todoapp.categories";
const LOCAL_STORAGE_SELECTED_CATEGORY_ID_KEY = "todoapp.selectedCategoryId";

function initilizeLocalStorageIfEmpty() {
  // example data
  const initCategories = [
    {
      id: Date.now().toString(),
      name: "Shopping",
      todos: [{ id: Date.now().toString(), isDone: false, text: "Buy eggs" }],
    },
  ];

  const initSelectedCategoryId = initCategories[0].id;

  if (localStorage.getItem(LOCAL_STORAGE_CATEGORY_KEY) === null) {
    localStorage.setItem(
      LOCAL_STORAGE_CATEGORY_KEY,
      JSON.stringify(initCategories)
    );
  }

  if (localStorage.getItem(LOCAL_STORAGE_SELECTED_CATEGORY_ID_KEY) === null) {
    localStorage.setItem(
      LOCAL_STORAGE_SELECTED_CATEGORY_ID_KEY,
      initSelectedCategoryId
    );
  }

  return {
    categories: JSON.parse(localStorage.getItem(LOCAL_STORAGE_CATEGORY_KEY)),
    selectedCategoryId: localStorage.getItem(
      LOCAL_STORAGE_SELECTED_CATEGORY_ID_KEY
    ),
  };
}

const domElements = {
  // find an element that has data-category-list attribute
  // just check existence of attribute, not it's value
  categoryList: document.querySelector("[data-category-list]"),

  newCategoryForm: document.querySelector("[data-new-category-form]"),
  newCategoryInput: document.querySelector("[data-new-category-input]"),

  clearDoneTodosButton: document.querySelector(
    "[data-clear-done-todos-button]"
  ),
  deleteCategoryButton: document.querySelector("[data-delete-category-button]"),

  todoListContainer: document.querySelector("[data-todo-list-container]"),
  todoHeaderTitle: document.querySelector("[data-todo-header-title]"),
  todoCount: document.querySelector("[data-todo-count]"),
  todoList: document.querySelector("[data-todo-list]"),

  todoItemTemplate: document.querySelector("#todo-item-template"),

  newTodoForm: document.querySelector("[data-new-todo-form]"),
  newTodoInput: document.querySelector("[data-new-todo-input]"),
};

const storageContainer = initilizeLocalStorageIfEmpty();

const dataContainer = {
  categories: storageContainer.categories,
  selectedCategoryId: storageContainer.selectedCategoryId,

  // todo item interface
  // {id: string, isDone: boolean, text: string}
};

// event listeners
domElements.newCategoryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const categoryName = domElements.newCategoryInput.value;
  if (!categoryName) return;
  const categoryData = createCategoryData(categoryName);
  domElements.newCategoryInput.value = null;
  dataContainer.categories.push(categoryData);
  saveAndRender();
});

domElements.categoryList.addEventListener("click", (e) => {
  if (e.target?.classList?.contains("category-item")) {
    dataContainer.selectedCategoryId = e.target?.dataset?.categoryId;
    saveAndRender();
  }
});

domElements.clearDoneTodosButton.addEventListener("click", (e) => {
  const selectedCategory = dataContainer.categories.find(
    (category) => category.id === dataContainer.selectedCategoryId
  );
  if (!selectedCategory) {
    console.error("No category selected");
    return;
  }

  selectedCategory.todos = selectedCategory?.todos?.filter(
    (todo) => todo?.isDone === false
  );

  saveAndRender();
});

domElements.deleteCategoryButton.addEventListener("click", (e) => {
  dataContainer.categories = dataContainer.categories.filter(
    (category) => category.id !== dataContainer.selectedCategoryId
  );
  dataContainer.selectedCategoryId = null;
  saveAndRender();
});

domElements.newTodoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const todoText = domElements.newTodoInput.value;
  if (!todoText) return;
  const todoData = createTodoData(todoText);
  domElements.newTodoInput.value = null;

  const selectedCategory = dataContainer.categories.find(
    (category) => category.id === dataContainer.selectedCategoryId
  );
  if (!selectedCategory) {
    console.error("No category selected");
    return;
  }
  selectedCategory?.todos?.push(todoData);

  saveAndRender();
});

domElements.todoList.addEventListener("click", (e) => {
  /*
   * the default browser checkbox (<input type="checkbox">)
   * has 0 opacity and has not pointer events
   * so it's not visible and clicable
   * but there is <label> that is attached to that checkbox (the 'for' attribute)
   * inside the <label> there is <span> for custom circle check box
   * and another <span> for todo text
   *
   * if user clicks on the text
   * the click event runs twice, first for todo text as target
   * second for the hidden checkbox as target!
   *
   * if user clicks on the custom circle checkbox
   * the click event runs twice, first for the circle as target
   * second for the hidden checkbox as target!
   *
   * so in both cases we can access the hidden checkbox element
   * we also attached the todo.id to the id attribute of this input checkbox element
   * so we can find the todo to update
   */
  if (!e?.target?.tagName?.toLowerCase() === "input") return;

  const checkboxElement = e?.target;

  const selectedCategory = dataContainer.categories.find(
    (category) => category.id === dataContainer.selectedCategoryId
  );
  if (!selectedCategory) {
    console.error("No category selected");
    return;
  }

  const selectedTodo = selectedCategory?.todos?.find(
    (todo) => todo?.id === checkboxElement?.id
  );

  selectedTodo.isDone = checkboxElement?.checked;

  saveToStorage();
  renderTodosCount(selectedCategory);
});

function createCategoryData(categoryName) {
  return {
    id: Date.now().toString(),
    name: categoryName,
    todos: [],
  };
}

function createTodoData(todoText) {
  return {
    id: Date.now().toString(),
    isDone: false,
    text: todoText,
  };
}

function saveAndRender() {
  saveToStorage();
  render();
}

function saveToStorage() {
  localStorage.setItem(
    LOCAL_STORAGE_CATEGORY_KEY,
    JSON.stringify(dataContainer.categories)
  );
  localStorage.setItem(
    LOCAL_STORAGE_SELECTED_CATEGORY_ID_KEY,
    dataContainer.selectedCategoryId
  );
}

function render() {
  renderCategories();

  const selectedCategory = dataContainer.categories.find(
    (category) => category.id === dataContainer.selectedCategoryId
  );
  if (
    !dataContainer.selectedCategoryId ||
    dataContainer.selectedCategoryId === "null"
  ) {
    domElements.todoListContainer.style.display = "none";
  } else {
    domElements.todoListContainer.style.display = "";
    domElements.todoHeaderTitle.innerText = selectedCategory?.name;
    renderTodosCount(selectedCategory);
    renderTodos(selectedCategory);
  }
}

function renderCategories() {
  clearElement(domElements?.categoryList);
  dataContainer.categories.forEach((category) => {
    const categoryItemElement = document.createElement("li");

    categoryItemElement.classList.add("category-item");
    if (dataContainer.selectedCategoryId === category.id) {
      categoryItemElement.classList.add("active");
    }

    // this data attribute is used when we want to find the id of data
    // in click listener, so we can find the category name and it's todos
    // with that id
    categoryItemElement.dataset.categoryId = category?.id;

    categoryItemElement.innerText = category?.name;

    domElements.categoryList.appendChild(categoryItemElement);
  });
}

function renderTodosCount(selectedCategory) {
  const remainingTodosCount = selectedCategory.todos.filter(
    (todo) => !todo.isDone
  ).length;

  const taskString = remainingTodosCount === 1 ? "task" : "tasks";

  domElements.todoCount.innerText = `${remainingTodosCount} ${taskString} remaining`;
}

function renderTodos(selectedCategory) {
  clearElement(domElements?.todoList);

  if (!"content" in document.createElement("tempalte")) {
    console.error("template tag is not supported in this browser");
    return;
  }

  selectedCategory.todos.forEach((todo) => {
    const todoItemInstanceElement =
      domElements.todoItemTemplate?.content?.cloneNode(true);

    const checkboxElement = todoItemInstanceElement.querySelector(
      "input[type='checkbox']"
    );
    checkboxElement.id = todo?.id;
    checkboxElement.checked = todo?.isDone;

    const labelElement = todoItemInstanceElement.querySelector(".todo-item");
    labelElement.htmlFor = todo?.id;

    const todoItemTextElement =
      todoItemInstanceElement.querySelector(".todo-item-text");
    todoItemTextElement.innerText = todo?.text;

    domElements?.todoList?.appendChild(todoItemInstanceElement);
  });
}

function clearElement(domElement) {
  while (domElement?.firstChild) {
    domElement?.removeChild(domElement?.firstChild);
  }
}

render();
