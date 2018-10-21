export default function ({ store, redirect, error }) {
  if (!store.state.auth.user) {
  	// // throw
    // error({
    //   message: 'Access denied',
    //   statusCode: 403
    // })
    // // or redirect
    redirect('/')
  }
}

