export default class Autocomplete {
  private callback: (
    value: string,
    callback: (suggestions: string[]) => void
  ) => void;
  private element: HTMLInputElement;
  private hideTimeout: NodeJS.Timeout;
  private visible: boolean;
  private default: string;
  private selection: number;
  private container: HTMLElement;

  public constructor(className, callback) {
    this.callback = callback;
    this.element = null;
    this.hideTimeout = null;
    this.visible = false;
    this.default = null;
    this.selection = null;

    this.container = document.createElement("div");
    this.container.style.position = "absolute";
    this.container.style.display = "block";
    this.container.style.opacity = "0";
    this.container.className = className;
  }

  public attach(el): void {
    el.setAttribute("autocomplete", "off");

    el.addEventListener("focus", () => {
      this.element = el;
      const domRect = el.getBoundingClientRect();
      this.container.style.left = `${domRect.left + window.pageXOffset}px`;
      this.container.style.width = `${domRect.width}px`;
      this.container.style.top = `${domRect.bottom + window.pageYOffset}px`;
      this.update();
    });

    el.addEventListener("blur", () => {
      if (this.element !== el) return;
      if (!this.visible) return;
      this.hide();
    });

    el.addEventListener("keydown", e => {
      if (this.element !== el) return;
      if (e.key === "Escape") {
        if (this.visible) this.hide();
      } else if (e.key === "Enter") {
        if (this.default != null) {
          el.value = this.default;
          e.preventDefault();
          this.update();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (this.selection == null) this.selection = 0;
        else ++this.selection;
        this.update();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        --this.selection;
        this.update();
      }
    });

    el.addEventListener("input", () => {
      if (this.element !== el) return;
      this.selection = null;
      this.update();
    });
  }

  private hide(): void {
    this.container.style.opacity = "0";
    this.visible = false;
    this.default = null;
    this.selection = null;
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      this.hideTimeout = null;
      while (this.container.firstChild)
        this.container.removeChild(this.container.firstChild);
      document.body.removeChild(this.container);
    }, 500);
  }

  private update(): void {
    const el = this.element;

    this.callback(el.value, suggestions => {
      if (this.element !== el) return;
      this.default = null;

      if (!suggestions.length) {
        if (this.visible) this.hide();

        return;
      }

      while (this.container.firstChild)
        this.container.removeChild(this.container.firstChild);

      if (!this.visible) {
        if (!this.hideTimeout) {
          document.body.appendChild(this.container);
          window.getComputedStyle(this.container).opacity;
        } else {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }
        this.container.style.opacity = "1";
        this.visible = true;
      }

      if (this.selection != null) {
        this.selection =
          ((this.selection % suggestions.length) + suggestions.length) %
          suggestions.length;
        this.default = suggestions[this.selection];
      } else {
        this.default = suggestions[0];
      }

      let selectedElement;
      for (const [idx, suggestion] of suggestions.entries()) {
        const e = document.createElement("div");
        e.classList.add("suggestion");
        if (idx === this.selection) {
          e.classList.add("selected");
          selectedElement = e;
        }

        const t = document.createTextNode(suggestion);
        e.appendChild(t);
        e.addEventListener("mousedown", ev => {
          ev.preventDefault();
          el.value = suggestion;
          if (this.element === el) this.update();
        });
        this.container.appendChild(e);
      }

      // Ensure selected element is in view
      if (selectedElement) {
        this.container.scrollTop = Math.min(
          this.container.scrollTop,
          selectedElement.offsetTop
        );

        this.container.scrollTop = Math.max(
          this.container.scrollTop,
          selectedElement.offsetTop +
            selectedElement.scrollHeight -
            this.container.clientHeight
        );
      }
    });
  }
}