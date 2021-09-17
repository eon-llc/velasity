import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import copy from 'copy-to-clipboard';

export default class CopyButtonComponent extends Component {
  @tracked hash;
  @tracked short = false;
  @service notify;

  @action
  copy(hash) {
    copy(hash);
    this.notify.info('Copied to clipboard.');
  }
}
