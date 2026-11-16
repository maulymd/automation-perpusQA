import { LoginPage } from '@pages/login.page';
import { LoansPage } from '@pages/loans.page';
import { OperatorLoansPage } from '@pages/operator-loans.page';
import { CatalogPage } from '@pages/catalog.page';
import { BookDetailPage } from '@pages/book-detail.page';
import { ConfirmDialogComponent } from '@pages/components/confirm-dialog.component';
import { ToastComponent } from '@pages/components/toast.component';
import { domainApiFixtures } from './api.fixture';

export interface PageFixtures {
  loginPage: LoginPage;
  loansPage: LoansPage;
  operatorLoansPage: OperatorLoansPage;
  catalogPage: CatalogPage;
  bookDetailPage: BookDetailPage;
  confirmDialog: ConfirmDialogComponent;
  toast: ToastComponent;
}

export const pageFixtures = domainApiFixtures.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  loansPage: async ({ page }, use) => {
    await use(new LoansPage(page));
  },
  operatorLoansPage: async ({ page }, use) => {
    await use(new OperatorLoansPage(page));
  },
  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },
  bookDetailPage: async ({ page }, use) => {
    await use(new BookDetailPage(page));
  },
  confirmDialog: async ({ page }, use) => {
    await use(new ConfirmDialogComponent(page));
  },
  toast: async ({ page }, use) => {
    await use(new ToastComponent(page));
  },
});
