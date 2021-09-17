import Route from '@ember/routing/route';
import { action } from '@ember/object';
import copy from 'copy-to-clipboard';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service notify;
  @service pageProgress;

  @action
  async loading(transition) {
    if (!transition.from || transition.from.name !== transition.to.name) {
      const pageProgress = this.pageProgress;
      pageProgress.start(transition.targetName);
      transition.promise.finally(() => {
        document.querySelector('#loading').classList.add('done');
        pageProgress.done();
      });
    } else {
      transition.promise.finally(() => {});
    }
    return true;
  }

  @action
  copy(key) {
    copy(key);
    this.notify.info('Copied to clipboard.');
  }
}
