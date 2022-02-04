//Project Type
enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

// creating a re-usable validation functionality
//validation
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validatabeInput: Validatable) {
  let isValid = true;
  if (validatabeInput.required) {
    isValid = isValid && validatabeInput.value.toString().trim().length !== 0;
  }
  if (
    validatabeInput.minLength != null &&
    typeof validatabeInput.value == 'string'
  ) {
    isValid =
      isValid && validatabeInput.value.length >= validatabeInput.minLength;
  }
  if (
    validatabeInput.maxLength != null &&
    typeof validatabeInput.value === 'string'
  ) {
    isValid =
      isValid && validatabeInput.value.length <= validatabeInput.maxLength;
  }
  if (
    validatabeInput.min != null &&
    typeof validatabeInput.value === 'number'
  ) {
    isValid = isValid && validatabeInput.value >= validatabeInput.min;
  }
  if (
    validatabeInput.max != null &&
    typeof validatabeInput.value === 'number'
  ) {
    isValid = isValid && validatabeInput.value <= validatabeInput.max;
  }
  return isValid;
}

// decorator is a function, autobind decorator
// autobind is to automatically bind to "this" keyword
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };
  return adjDescriptor;
}

// Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as U;
    if (newElementId) {
      this.element.id = newElementId;
    }
    this.attach(insertAtStart);
  }
  private attach(insertAtBeginning: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? 'afterbegin' : 'beforeend',
      this.element
    );
  }
  abstract configure(): void;
  abstract renderContent(): void;
}

// Project State Managemenent with own custom type
type Listener<T> = (items: Project[]) => void;

class State<T> {
  protected listeners: Listener<T>[] = [];

  addListener(listernFn: Listener<T>) {
    this.listeners.push(listernFn);
  }
}

//Project state management
class ProjectState extends State<Project> {
  //private listeners: Listener[] = [];
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }

  //A static method is part of a class definition, but is not part of the objects it create
  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, desciption: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      desciption,
      numOfPeople,
      ProjectStatus.Active
    );
    this.projects.push(newProject);
    for (const listernFn of this.listeners) {
      listernFn(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance();

class ProjectList extends Component<HTMLDivElement, HTMLElement> {
  assignedProjects: Project[];
  constructor(private type: 'active' | 'finished') {
    super('project-list', 'app', false, `${type}-projects`); //getting an access to methods and properties of our parent component class
    this.assignedProjects = [];
    this.configure();
    this.renderContent();
  }
  configure() {
    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((prj) => {
        if (this.type === 'active') {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }
  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;
    listEl.innerHTML = '';
    for (const prjItem of this.assignedProjects) {
      const listItem = document.createElement('li');
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);
    }
  }

  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent =
      this.type.toUpperCase() + ' PROJECTS';
  }
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super('project-input', 'app', true, 'user-input');
    this.titleInputElement = this.element.querySelector(
      '#title'
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      '#description'
    ) as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      '#people'
    ) as HTMLInputElement;
    this.configure();
  }
  configure() {
    this.element.addEventListener('submit', this.submitHandler);
  }
  renderContent() {}

  // collect inputs from PMApp form
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
    };

    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    };

    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 11,
    };

    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert('Invalid input');
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  private clearInputs() {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.peopleInputElement.value = '';
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, desc, people] = userInput;
      projectState.addProject(title, desc, people);
      //console.log(title, desc, people);
      this.clearInputs();
    }
  }
}
const prjInput = new ProjectInput();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');